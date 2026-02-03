# 🔍 AUDITORIA TÉCNICA - BOLÃO PRIVADO
## Relatório de Análise e Proposta de Refatoração para Clean Architecture

**Data:** 19 de Janeiro de 2026  
**Autor:** fullstack-developer Agent  
**Stack:** Node.js + Express + SQLite + HTML/CSS Vanilla

---

## 📊 1. ANÁLISE DA ESTRUTURA ATUAL

### 1.1 Visão Geral do Projeto

O projeto **Bolão Privado** é uma aplicação web de apostas entre amigos, inspirada no modelo Polymarket, que implementa um sistema de pool de apostas (Pari-Mutuel) com as seguintes características:

**Arquivos Principais:**
```
bolao-privado/
├── server.js (38.4 KB - MONOLÍTICO)
├── package.json
├── bolao.db (SQLite)
├── public/
│   ├── index.html
│   ├── admin.html
│   ├── login.html
│   ├── flash-message.js
│   ├── flash-message.css
│   └── permission-interceptor.js
└── tests/
    ├── auth.test.js
    ├── apostas.test.js
    ├── eventos.test.js
    ├── historico.test.js
    ├── permissoes.test.js
    └── calculos.test.js
```

**Total de Testes:** 73 testes cobrindo todas as funcionalidades críticas  
**Cobertura Atual:** Configurada para > 80% (lines, functions, statements)

---

### 1.2 Problemas Identificados na Arquitetura Atual

#### ❌ **Problema 1: Monólito de 38.4 KB em um único arquivo**
O arquivo `server.js` contém:
- Configuração de banco de dados
- Middlewares de autenticação
- Lógica de negócio (cálculos financeiros)
- Rotas HTTP (33+ endpoints)
- Gerenciamento de sessões
- Inicialização do servidor

**Violações:**
- ❌ **Single Responsibility Principle (SOLID)** - Um arquivo faz tudo
- ❌ **Open/Closed Principle** - Difícil adicionar novas features sem modificar código existente
- ❌ **Dependency Inversion** - Camadas superiores dependem diretamente do banco de dados

#### ❌ **Problema 2: Lógica de Negócio Acoplada a Rotas**
```javascript
// Exemplo atual (ANTI-PATTERN):
app.post('/apostar', requireAuth, (req, res) => {
    const { time, valor } = req.body;
    
    // LÓGICA DE NEGÓCIO MISTURADA COM ROTA
    if (valor < 1) {
        return res.status(400).json({ erro: 'Valor mínimo R$ 1' });
    }
    
    // ACESSO DIRETO AO BANCO
    db.run('INSERT INTO apostas...', [userId, time, valor], ...);
});
```

**Consequências:**
- Impossível testar lógica sem iniciar servidor
- Lógica de negócio espalhada em múltiplos endpoints
- Difícil reutilização de código

#### ❌ **Problema 3: Funções Auxiliares Globais**
```javascript
// Funções soltas no escopo global do server.js:
function calcularResumo(apostas, evento) { ... }
function calcularRetornoEstimado(apostas, time, valor) { ... }
function getEventoAtivo(callback) { ... }
function criarNovoEvento(callback) { ... }
```

**Problemas:**
- Não são módulos independentes
- Difícil testar isoladamente
- Mistura de responsabilidades (cálculos + persistência)

#### ❌ **Problema 4: Acesso Direto ao Banco em Todo Lugar**
```javascript
// Banco de dados global acessível em qualquer lugar:
const db = new sqlite3.Database('./bolao.db', ...);

// Callbacks aninhados (Callback Hell):
db.get('SELECT * FROM usuarios WHERE id = ?', [id], (err, user) => {
    db.all('SELECT * FROM apostas WHERE userId = ?', [user.id], (err, apostas) => {
        db.get('SELECT * FROM eventos_historico WHERE id = ?', [eventoId], (err, evento) => {
            // 3 níveis de aninhamento...
        });
    });
});
```

**Consequências:**
- Callback Hell
- Impossível mockar banco para testes
- Violação do princípio de Dependency Inversion

#### ❌ **Problema 5: Constantes e Regras de Negócio Hardcoded**
```javascript
// Taxa da plataforma hardcoded:
const TAXA_PLATAFORMA = 0.05;

// Validações espalhadas:
if (senha.length < 6) { ... }  // Em um lugar
if (valor < 1) { ... }         // Em outro lugar
if (usuario.isAdmin !== 1) { ... } // Em outro lugar
```

**Problemas:**
- Regras de negócio não documentadas em um lugar central
- Difícil alterar valores sem procurar em todo código

---

## 🎯 2. MAPEAMENTO DE DOMÍNIO

### 2.1 Identificação das Entidades de Domínio

#### **Entidade 1: Usuario**
**Regras de Negócio:**
- Email único (identificador)
- Senha mínima de 6 caracteres
- Três tipos: `usuario`, `admin`, `superadmin`
- Super Admin não pode apostar
- Admin pode gerenciar eventos, mas não promover outros admins
- Super Admin pode promover/rebaixar qualquer usuário

**Atributos:**
```javascript
{
    id: Integer,
    nome: String,
    email: String (unique),
    senha: String (hash),
    isAdmin: Boolean,
    isSuperAdmin: Boolean,
    tipo: Enum ['usuario', 'admin', 'superadmin'],
    criadoEm: DateTime
}
```

#### **Entidade 2: Evento**
**Regras de Negócio:**
- Um evento pode estar `ativo`, `finalizado` ou `arquivado`
- Apenas um evento pode estar ativo por vez
- Evento deve ter 2-10 times cadastrados
- Apostas só podem ser feitas em eventos abertos
- Evento fechado não pode ser reaberto (exceto por reset)
- Vencedor só pode ser definido após fechar apostas

**Atributos:**
```javascript
{
    id: Integer,
    codigo: String (unique),
    nome: String,
    times: Array<String>,
    aberto: Boolean,
    vencedor: String | null,
    status: Enum ['ativo', 'finalizado', 'arquivado'],
    criadoEm: DateTime,
    finalizadoEm: DateTime | null
}
```

#### **Entidade 3: Aposta**
**Regras de Negócio:**
- Valor mínimo: R$ 1.00
- Apostador não pode ser Super Admin
- Aposta vinculada a um evento específico
- Aposta não pode ser editada ou excluída após criação
- Aposta só pode ser feita em evento aberto

**Atributos:**
```javascript
{
    id: Integer,
    userId: Integer,
    eventoId: Integer,
    nome: String,
    time: String,
    valor: Float (min: 1.00),
    timestamp: DateTime
}
```

---

### 2.2 Identificação dos Casos de Uso (Use Cases)

#### **UC01: Autenticação**
- `RegistrarUsuario(nome, email, senha)`
- `FazerLogin(email, senha)`
- `FazerLogout(userId)`
- `ObterUsuarioAtual(userId)`
- `VerificarPermissoes(userId)`

#### **UC02: Gerenciamento de Apostas**
- `CriarAposta(userId, eventoId, time, valor)`
- `ListarMinhasApostas(userId, eventoId)`
- `CalcularRetornoEstimado(apostas, time, valor)`
- `ObterHistoricoApostas(userId, filtros, paginacao)`

#### **UC03: Gerenciamento de Eventos**
- `CriarNovoEvento(nome, times)`
- `ObterEventoAtivo()`
- `AbrirFecharApostas(eventoId)`
- `DefinirVencedor(eventoId, time)`
- `FinalizarEvento(eventoId)`
- `ResetarEventoParaNovo()`

#### **UC04: Cálculos Financeiros**
- `CalcularResumoEvento(apostas, evento)`
- `CalcularProbabilidades(apostas, times)`
- `CalcularDistribuicaoPremios(apostas, vencedor, taxaPlataforma)`
- `CalcularGanhosVencedores(apostas, vencedor, taxaPlataforma)`

#### **UC05: Gerenciamento de Usuários (Admin)**
- `ListarTodosUsuarios()`
- `PromoverUsuarioParaAdmin(userId)`
- `RebaixarAdminParaUsuario(userId)`
- `ExcluirUsuario(userId)` *(não implementado)*

---

### 2.3 Regras de Negócio Centrais (Domain Rules)

#### **Regra 1: Taxa da Plataforma**
```javascript
TAXA_PLATAFORMA = 5%
totalPremio = totalGeral × (1 - 0.05)
```
📍 **Onde extrair:** Domain Layer - `TaxaPlataforma` Value Object

#### **Regra 2: Cálculo de Probabilidade (Pari-Mutuel)**
```javascript
Probabilidade(Time X) = totalTimeX / totalGeral
```
📍 **Onde extrair:** Domain Layer - `CalculadoraProbabilidade` Service

#### **Regra 3: Distribuição Proporcional de Prêmios**
```javascript
Ganho(Apostador) = (valorApostado / totalTimeVencedor) × totalPremio
```
📍 **Onde extrair:** Domain Layer - `CalculadoraPremios` Service

#### **Regra 4: Validações de Permissão**
```javascript
// Super Admin:
- Pode gerenciar usuários (promover/rebaixar)
- Pode gerenciar eventos (criar, fechar, definir vencedor, reset)
- NÃO pode fazer apostas

// Admin:
- Pode gerenciar eventos
- Pode fazer apostas
- NÃO pode gerenciar usuários

// Usuario:
- Pode fazer apostas
- NÃO pode gerenciar eventos ou usuários
```
📍 **Onde extrair:** Domain Layer - `PermissoesUsuario` Entity/Service

---

## 🏗️ 3. PROPOSTA DE REFATORAÇÃO - CLEAN ARCHITECTURE

### 3.1 Nova Estrutura de Pastas

```
bolao-privado/
│
├── src/
│   │
│   ├── domain/                          # 🔵 CAMADA DE DOMÍNIO (Regras de Negócio Puras)
│   │   ├── entities/
│   │   │   ├── Usuario.js
│   │   │   ├── Evento.js
│   │   │   └── Aposta.js
│   │   │
│   │   ├── value-objects/
│   │   │   ├── Email.js
│   │   │   ├── Senha.js
│   │   │   ├── TaxaPlataforma.js
│   │   │   └── ValorAposta.js
│   │   │
│   │   ├── services/
│   │   │   ├── CalculadoraProbabilidade.js
│   │   │   ├── CalculadoraPremios.js
│   │   │   ├── CalculadoraRetorno.js
│   │   │   └── ValidadorPermissoes.js
│   │   │
│   │   └── repositories/                # Interfaces (contratos)
│   │       ├── IUsuarioRepository.js
│   │       ├── IEventoRepository.js
│   │       └── IApostaRepository.js
│   │
│   ├── application/                     # 🟢 CAMADA DE APLICAÇÃO (Casos de Uso)
│   │   ├── use-cases/
│   │   │   ├── autenticacao/
│   │   │   │   ├── RegistrarUsuario.js
│   │   │   │   ├── FazerLogin.js
│   │   │   │   ├── FazerLogout.js
│   │   │   │   └── ObterUsuarioAtual.js
│   │   │   │
│   │   │   ├── apostas/
│   │   │   │   ├── CriarAposta.js
│   │   │   │   ├── ListarMinhasApostas.js
│   │   │   │   ├── CalcularRetornoEstimado.js
│   │   │   │   └── ObterHistoricoApostas.js
│   │   │   │
│   │   │   ├── eventos/
│   │   │   │   ├── CriarNovoEvento.js
│   │   │   │   ├── ObterEventoAtivo.js
│   │   │   │   ├── AbrirFecharApostas.js
│   │   │   │   ├── DefinirVencedor.js
│   │   │   │   └── ResetarEvento.js
│   │   │   │
│   │   │   └── usuarios/
│   │   │       ├── ListarUsuarios.js
│   │   │       ├── PromoverParaAdmin.js
│   │   │       └── RebaixarParaUsuario.js
│   │   │
│   │   └── dto/                         # Data Transfer Objects
│   │       ├── UsuarioDTO.js
│   │       ├── EventoDTO.js
│   │       └── ApostaDTO.js
│   │
│   ├── infrastructure/                  # 🟡 CAMADA DE INFRAESTRUTURA (Implementação Técnica)
│   │   ├── database/
│   │   │   ├── sqlite.js               # Conexão SQLite
│   │   │   ├── migrations/             # Scripts de migração
│   │   │   │   └── 001_initial.sql
│   │   │   └── seeds/                  # Dados iniciais
│   │   │       └── superadmin.js
│   │   │
│   │   ├── repositories/               # Implementações concretas
│   │   │   ├── SQLiteUsuarioRepository.js
│   │   │   ├── SQLiteEventoRepository.js
│   │   │   └── SQLiteApostaRepository.js
│   │   │
│   │   ├── security/
│   │   │   ├── bcrypt-hasher.js
│   │   │   └── session-manager.js
│   │   │
│   │   └── config/
│   │       ├── database.config.js
│   │       └── server.config.js
│   │
│   ├── interface/                       # 🟣 CAMADA DE INTERFACE (API/Web)
│   │   ├── http/
│   │   │   ├── server.js               # Express server (thin layer)
│   │   │   │
│   │   │   ├── routes/
│   │   │   │   ├── auth.routes.js
│   │   │   │   ├── apostas.routes.js
│   │   │   │   ├── eventos.routes.js
│   │   │   │   └── usuarios.routes.js
│   │   │   │
│   │   │   ├── controllers/
│   │   │   │   ├── AuthController.js
│   │   │   │   ├── ApostasController.js
│   │   │   │   ├── EventosController.js
│   │   │   │   └── UsuariosController.js
│   │   │   │
│   │   │   ├── middlewares/
│   │   │   │   ├── authentication.js
│   │   │   │   ├── authorization.js
│   │   │   │   ├── error-handler.js
│   │   │   │   └── request-validator.js
│   │   │   │
│   │   │   └── validators/
│   │   │       ├── auth.validator.js
│   │   │       ├── aposta.validator.js
│   │   │       └── evento.validator.js
│   │   │
│   │   └── static/                     # HTML/CSS/JS do frontend
│   │       ├── index.html
│   │       ├── admin.html
│   │       ├── login.html
│   │       ├── css/
│   │       │   └── flash-message.css
│   │       └── js/
│   │           ├── flash-message.js
│   │           └── permission-interceptor.js
│   │
│   └── shared/                          # 🔷 COMPARTILHADO (Utilidades)
│       ├── errors/
│       │   ├── AppError.js
│       │   ├── ValidationError.js
│       │   └── AuthenticationError.js
│       │
│       └── utils/
│           ├── date-formatter.js
│           └── currency-formatter.js
│
├── tests/
│   ├── unit/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   ├── value-objects/
│   │   │   └── services/
│   │   │
│   │   ├── application/
│   │   │   └── use-cases/
│   │   │
│   │   └── infrastructure/
│   │       └── repositories/
│   │
│   ├── integration/
│   │   ├── auth.test.js
│   │   ├── apostas.test.js
│   │   └── eventos.test.js
│   │
│   └── e2e/
│       └── complete-flow.test.js
│
├── public/                              # Servido estaticamente pelo Express
│   └── (movido para src/interface/static/)
│
├── bolao.db
├── package.json
├── .env.example
└── README.md
```

---

### 3.2 Fluxo de Dependências (Clean Architecture)

```
┌─────────────────────────────────────────────────────┐
│                  INTERFACE LAYER                     │
│     (Controllers, Routes, Middlewares, Views)       │
│  ┌────────────────────────────────────────────┐    │
│  │  HTTP Request → Controller → Use Case       │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│               APPLICATION LAYER                      │
│         (Use Cases, DTOs, Business Logic)           │
│  ┌────────────────────────────────────────────┐    │
│  │  Use Case → Domain Services → Entities     │    │
│  │  Use Case → Repository Interface           │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│                 DOMAIN LAYER                         │
│    (Entities, Value Objects, Domain Services)       │
│  ┌────────────────────────────────────────────┐    │
│  │  Pure Business Logic (Framework Agnostic)  │    │
│  │  No dependencies on external layers        │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
                      ▲
                      │
┌─────────────────────┴───────────────────────────────┐
│             INFRASTRUCTURE LAYER                     │
│    (Database, External APIs, File System)           │
│  ┌────────────────────────────────────────────┐    │
│  │  Repository Implementation (SQLite)        │    │
│  │  Bcrypt, Sessions, etc.                    │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

**Princípios:**
- ✅ Camadas internas não conhecem camadas externas
- ✅ Dependências apontam sempre para dentro (Domain)
- ✅ Domain Layer não tem dependências externas (nem Express, nem SQLite, nem bcrypt)
- ✅ Infrastructure implementa interfaces definidas no Domain
- ✅ Interface Layer apenas coordena (thin controllers)

---

## 🧪 4. ESTRATÉGIA DE TESTES

### 4.1 Análise dos Testes Atuais

**Status Atual:** ✅ **EXCELENTE**
- **73 testes** cobrindo todas as funcionalidades críticas
- Estrutura organizada por domínio
- Cobertura configurada para > 80%
- Uso de SQLite em memória para testes

**Arquivos de Teste:**
```
tests/
├── setup.js              # ✅ Configuração global
├── auth.test.js          # ✅ 10 testes de autenticação
├── apostas.test.js       # ✅ 8 testes de apostas
├── eventos.test.js       # ✅ 9 testes de eventos
├── historico.test.js     # ✅ 14 testes de histórico
├── permissoes.test.js    # ✅ 12 testes de permissões
└── calculos.test.js      # ✅ 20 testes de cálculos (PURE FUNCTIONS)
```

### 4.2 Proposta de Reorganização dos Testes

#### **Pirâmide de Testes Ideal**
```
         /\
        /  \  E2E (5%)
       /    \  - Fluxos completos
      /------\
     /        \ Integration (15%)
    /          \ - APIs + Database
   /------------\
  /              \ Unit (80%)
 /                \ - Domain + Use Cases
/------------------\
```

#### **Nova Estrutura de Testes:**

```
tests/
│
├── unit/                                # 🔵 80% dos testes
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── Usuario.test.js         # Validações de entidade
│   │   │   ├── Evento.test.js
│   │   │   └── Aposta.test.js
│   │   │
│   │   ├── value-objects/
│   │   │   ├── Email.test.js           # Validação de formato
│   │   │   ├── Senha.test.js           # Regra: mínimo 6 chars
│   │   │   ├── ValorAposta.test.js     # Regra: mínimo R$ 1
│   │   │   └── TaxaPlataforma.test.js  # Cálculo: 5%
│   │   │
│   │   └── services/
│   │       ├── CalculadoraProbabilidade.test.js  # ✅ JÁ EXISTE (calculos.test.js)
│   │       ├── CalculadoraPremios.test.js        # ✅ JÁ EXISTE (calculos.test.js)
│   │       ├── CalculadoraRetorno.test.js        # ✅ JÁ EXISTE (calculos.test.js)
│   │       └── ValidadorPermissoes.test.js       # ✅ JÁ EXISTE (permissoes.test.js)
│   │
│   ├── application/
│   │   └── use-cases/
│   │       ├── autenticacao/
│   │       │   ├── RegistrarUsuario.test.js      # ✅ JÁ EXISTE (auth.test.js)
│   │       │   ├── FazerLogin.test.js            # ✅ JÁ EXISTE (auth.test.js)
│   │       │   └── FazerLogout.test.js           # ✅ JÁ EXISTE (auth.test.js)
│   │       │
│   │       ├── apostas/
│   │       │   ├── CriarAposta.test.js           # ✅ JÁ EXISTE (apostas.test.js)
│   │       │   └── ListarMinhasApostas.test.js   # ✅ JÁ EXISTE (apostas.test.js)
│   │       │
│   │       └── eventos/
│   │           ├── CriarNovoEvento.test.js       # ✅ JÁ EXISTE (eventos.test.js)
│   │           ├── DefinirVencedor.test.js       # ✅ JÁ EXISTE (eventos.test.js)
│   │           └── ResetarEvento.test.js         # ✅ JÁ EXISTE (eventos.test.js)
│   │
│   └── infrastructure/
│       └── repositories/
│           ├── SQLiteUsuarioRepository.test.js   # Mock de DB
│           ├── SQLiteEventoRepository.test.js
│           └── SQLiteApostaRepository.test.js
│
├── integration/                         # 🟢 15% dos testes
│   ├── auth-flow.test.js                # ✅ JÁ EXISTE (auth.test.js)
│   ├── apostas-flow.test.js             # ✅ JÁ EXISTE (apostas.test.js)
│   └── admin-flow.test.js               # ✅ JÁ EXISTE (permissoes.test.js)
│
├── e2e/                                 # 🟣 5% dos testes
│   └── complete-betting-cycle.test.js   # 🆕 CRIAR: Registro → Login → Apostar → Vencer
│
├── setup.js                             # ✅ JÁ EXISTE
└── README.md                            # ✅ JÁ EXISTE (excelente documentação)
```

#### **Estratégia de Refatoração dos Testes:**

**Fase 1: Manter compatibilidade (durante refatoração)**
- ✅ Manter testes atuais funcionando
- ✅ Adicionar testes unitários para novos módulos
- ✅ Testar cada Use Case isoladamente

**Fase 2: Migração gradual**
- Migrar testes para nova estrutura de pastas
- Separar testes unitários de integração
- Adicionar testes E2E

**Fase 3: Otimização**
- Atingir 90%+ de cobertura
- Remover testes redundantes
- Adicionar testes de performance

---

### 4.3 Exemplo de Teste Unitário (Domain Service)

**ANTES (atual):**
```javascript
// tests/calculos.test.js (misturado com lógica do servidor)
describe('Cálculos Financeiros', () => {
    const TAXA_PLATAFORMA = 0.05; // Duplicado do server.js
    
    test('Deve calcular retorno corretamente', () => {
        const apostas = [{ time: 'Time A', valor: 100 }];
        const totalGeral = 100;
        const totalPremio = totalGeral * (1 - TAXA_PLATAFORMA);
        const retorno = (100 / 100) * totalPremio;
        expect(retorno).toBe(95);
    });
});
```

**DEPOIS (Clean Architecture):**
```javascript
// tests/unit/domain/services/CalculadoraPremios.test.js
const CalculadoraPremios = require('@/domain/services/CalculadoraPremios');
const TaxaPlataforma = require('@/domain/value-objects/TaxaPlataforma');

describe('CalculadoraPremios', () => {
    let calculadora;
    let taxaPlataforma;
    
    beforeEach(() => {
        taxaPlataforma = new TaxaPlataforma(0.05); // 5%
        calculadora = new CalculadoraPremios(taxaPlataforma);
    });
    
    test('Deve calcular prêmio total aplicando taxa da plataforma', () => {
        const totalGeral = 100;
        const premioTotal = calculadora.calcularPremioTotal(totalGeral);
        
        expect(premioTotal).toBe(95);
    });
    
    test('Deve calcular distribuição proporcional entre vencedores', () => {
        const apostas = [
            { time: 'Time A', valor: 100, usuario: 'João' },
            { time: 'Time A', valor: 200, usuario: 'Maria' },
            { time: 'Time B', valor: 300, usuario: 'Pedro' }
        ];
        
        const distribuicao = calculadora.calcularDistribuicao(apostas, 'Time A');
        
        expect(distribuicao).toEqual([
            { usuario: 'João', apostado: 100, ganho: 237.5, lucro: 137.5 },
            { usuario: 'Maria', apostado: 200, ganho: 475, lucro: 275 }
        ]);
    });
    
    test('Deve retornar array vazio quando nenhum vencedor', () => {
        const apostas = [
            { time: 'Time A', valor: 100 },
            { time: 'Time B', valor: 200 }
        ];
        
        const distribuicao = calculadora.calcularDistribuicao(apostas, 'Time C');
        
        expect(distribuicao).toEqual([]);
    });
});
```

**Vantagens:**
- ✅ Isolado (não depende de banco, servidor, etc.)
- ✅ Rápido (milissegundos)
- ✅ Testável (Domain Service puro)
- ✅ Reutilizável (Use Cases podem usar essa calculadora)

---

## 📝 5. PLANO DE REFATORAÇÃO

### 5.1 Estratégia: Refatoração Incremental (Strangler Fig Pattern)

**Por que não reescrever tudo de uma vez?**
- ❌ Alto risco de quebrar funcionalidades
- ❌ Testes atuais param de funcionar
- ❌ Impossível fazer deploy durante refatoração

**Estratégia Recomendada: Strangler Fig (Estrangulamento)**
- ✅ Criar nova arquitetura ao lado da antiga
- ✅ Migrar módulo por módulo
- ✅ Manter testes sempre passando
- ✅ Deploy contínuo durante refatoração

---

### 5.2 Fases de Refatoração

#### **FASE 1: Preparação (1-2 dias)**
- [ ] Criar estrutura de pastas `src/`
- [ ] Configurar alias de importação (`@/domain`, `@/application`, etc.)
- [ ] Instalar ferramentas de linting/formatação
- [ ] Documentar decisões arquiteturais

#### **FASE 2: Extrair Domain Layer (3-5 dias)**
**Prioridade ALTA - Base de tudo**

1. **Criar Value Objects:**
   - [ ] `Email.js` - Validação de formato
   - [ ] `Senha.js` - Validação de tamanho mínimo (6 chars)
   - [ ] `ValorAposta.js` - Validação de valor mínimo (R$ 1)
   - [ ] `TaxaPlataforma.js` - Constante 5% encapsulada
   
2. **Criar Entities:**
   - [ ] `Usuario.js` - Lógica de validação de usuário
   - [ ] `Evento.js` - Lógica de estados (ativo, fechado, finalizado)
   - [ ] `Aposta.js` - Lógica de validação de aposta
   
3. **Criar Domain Services:**
   - [ ] `CalculadoraProbabilidade.js` - Extrair de `calcularResumo()`
   - [ ] `CalculadoraPremios.js` - Extrair cálculos financeiros
   - [ ] `CalculadoraRetorno.js` - Extrair `calcularRetornoEstimado()`
   - [ ] `ValidadorPermissoes.js` - Extrair validações de admin/superadmin
   
4. **Criar Repository Interfaces:**
   - [ ] `IUsuarioRepository.js`
   - [ ] `IEventoRepository.js`
   - [ ] `IApostaRepository.js`

5. **Testes Unitários:**
   - [ ] Testar cada Value Object isoladamente
   - [ ] Testar cada Entity isoladamente
   - [ ] Testar cada Domain Service isoladamente

#### **FASE 3: Extrair Infrastructure Layer (2-3 dias)**
**Implementações concretas**

1. **Configuração de Banco:**
   - [ ] `src/infrastructure/database/sqlite.js`
   - [ ] Migrar função `inicializarBancoDados()` para migration script
   - [ ] Criar `DatabaseConnection` singleton

2. **Implementar Repositories:**
   - [ ] `SQLiteUsuarioRepository.js` - Implementa `IUsuarioRepository`
   - [ ] `SQLiteEventoRepository.js` - Implementa `IEventoRepository`
   - [ ] `SQLiteApostaRepository.js` - Implementa `IApostaRepository`

3. **Security:**
   - [ ] `bcrypt-hasher.js` - Encapsular bcrypt
   - [ ] `session-manager.js` - Encapsular express-session

4. **Testes de Integração:**
   - [ ] Testar Repositories com banco em memória
   - [ ] Testar conexão com SQLite

#### **FASE 4: Extrair Application Layer (3-4 dias)**
**Use Cases**

1. **Use Cases de Autenticação:**
   - [ ] `RegistrarUsuario.js` - Extrair lógica de `/auth/registro`
   - [ ] `FazerLogin.js` - Extrair lógica de `/auth/login`
   - [ ] `FazerLogout.js` - Extrair lógica de `/auth/logout`
   - [ ] `ObterUsuarioAtual.js` - Extrair lógica de `/auth/me`

2. **Use Cases de Apostas:**
   - [ ] `CriarAposta.js` - Extrair lógica de `/apostar`
   - [ ] `ListarMinhasApostas.js` - Extrair lógica de `/minhas-apostas`
   - [ ] `ObterHistoricoApostas.js` - Extrair lógica de `/historico-apostas`

3. **Use Cases de Eventos:**
   - [ ] `CriarNovoEvento.js` - Extrair `criarNovoEvento()`
   - [ ] `ObterEventoAtivo.js` - Extrair `getEventoAtivo()`
   - [ ] `AbrirFecharApostas.js` - Extrair lógica de `/evento/abrir-fechar`
   - [ ] `DefinirVencedor.js` - Extrair lógica de `/vencedor`
   - [ ] `ResetarEvento.js` - Extrair lógica de `/reset`

4. **Use Cases de Usuários:**
   - [ ] `ListarUsuarios.js` - Extrair lógica de `/usuarios`
   - [ ] `PromoverParaAdmin.js` - Extrair lógica de `/usuarios/:id/promover`
   - [ ] `RebaixarParaUsuario.js` - Extrair lógica de `/usuarios/:id/rebaixar`

5. **Testes de Use Cases:**
   - [ ] Mockar Repositories
   - [ ] Testar cada Use Case isoladamente

#### **FASE 5: Extrair Interface Layer (2-3 dias)**
**Controllers, Routes, Middlewares**

1. **Criar Controllers Thin:**
   - [ ] `AuthController.js` - Apenas chamar Use Cases
   - [ ] `ApostasController.js`
   - [ ] `EventosController.js`
   - [ ] `UsuariosController.js`

2. **Criar Rotas Modulares:**
   - [ ] `auth.routes.js`
   - [ ] `apostas.routes.js`
   - [ ] `eventos.routes.js`
   - [ ] `usuarios.routes.js`

3. **Extrair Middlewares:**
   - [ ] `authentication.js` - Extrair `requireAuth`
   - [ ] `authorization.js` - Extrair `requireAdmin`, `requireSuperAdmin`
   - [ ] `error-handler.js` - Tratamento centralizado de erros
   - [ ] `request-validator.js` - Validação de entrada

4. **Criar Validators:**
   - [ ] `auth.validator.js` - Validar campos de registro/login
   - [ ] `aposta.validator.js` - Validar campos de aposta
   - [ ] `evento.validator.js` - Validar campos de evento

5. **Novo server.js (thin):**
   ```javascript
   // src/interface/http/server.js
   const express = require('express');
   const routes = require('./routes');
   const middlewares = require('./middlewares');
   
   const app = express();
   
   // Configurações
   middlewares.configurar(app);
   
   // Rotas
   app.use('/api', routes);
   
   // Error Handler
   app.use(middlewares.errorHandler);
   
   module.exports = app;
   ```

#### **FASE 6: Migração Gradual (1-2 semanas)**
**Migrar rotas uma por uma**

**Estratégia:**
- Manter `server.js` antigo funcionando
- Criar `server-new.js` com nova arquitetura
- Migrar rota por rota, testando sempre
- Quando 100% migrado, deletar `server-old.js`

**Ordem de Migração:**
1. [ ] Rotas de autenticação (`/auth/*`)
2. [ ] Rotas de apostas (`/apostar`, `/resumo`)
3. [ ] Rotas de eventos (`/evento/*`, `/vencedor`, `/reset`)
4. [ ] Rotas de usuários (`/usuarios/*`)
5. [ ] Rotas de histórico (`/historico-apostas`)

#### **FASE 7: Otimização e Documentação (1 semana)**
- [ ] Revisar todos os testes
- [ ] Atingir 90%+ cobertura
- [ ] Adicionar JSDoc em todos os módulos
- [ ] Criar diagramas de arquitetura
- [ ] Atualizar README.md
- [ ] Adicionar exemplos de uso

---

### 5.3 Exemplo de Refatoração (CriarAposta Use Case)

#### **ANTES (server.js):**
```javascript
app.post('/apostar', requireAuth, (req, res) => {
    const { time, valor } = req.body;

    if (!time || !valor) {
        return res.status(400).json({ erro: 'Time e valor são obrigatórios' });
    }

    if (valor < 1) {
        return res.status(400).json({ erro: 'Valor mínimo é R$ 1' });
    }

    db.get('SELECT * FROM usuarios WHERE id = ?', [req.session.userId], (err, usuario) => {
        if (usuario.isSuperAdmin === 1) {
            return res.status(403).json({ erro: 'Super Admin não pode apostar' });
        }

        getEventoAtivo((err, eventoAtivo) => {
            if (!eventoAtivo || !eventoAtivo.aberto) {
                return res.status(400).json({ erro: 'Apostas fechadas' });
            }

            if (!eventoAtivo.times.includes(time)) {
                return res.status(400).json({ erro: 'Time inválido' });
            }

            db.run('INSERT INTO apostas (userId, eventoId, nome, time, valor) VALUES (?, ?, ?, ?, ?)',
                [req.session.userId, eventoAtivo.id, usuario.nome, time, valor],
                function (err) {
                    if (err) {
                        return res.status(500).json({ erro: 'Erro ao criar aposta' });
                    }

                    res.json({
                        sucesso: true,
                        apostaId: this.lastID,
                        mensagem: 'Aposta realizada com sucesso'
                    });
                }
            );
        });
    });
});
```

#### **DEPOIS (Clean Architecture):**

**1. Domain Service:**
```javascript
// src/domain/services/ValidadorAposta.js
class ValidadorAposta {
    validar(aposta, usuario, evento) {
        if (usuario.isSuperAdmin()) {
            throw new ValidationError('Super Admin não pode apostar');
        }

        if (!evento.estaAberto()) {
            throw new ValidationError('Apostas fechadas');
        }

        if (!evento.contemTime(aposta.time)) {
            throw new ValidationError('Time inválido');
        }

        if (!aposta.valorValido()) {
            throw new ValidationError('Valor mínimo é R$ 1');
        }

        return true;
    }
}

module.exports = ValidadorAposta;
```

**2. Use Case:**
```javascript
// src/application/use-cases/apostas/CriarAposta.js
class CriarAposta {
    constructor(apostaRepository, eventoRepository, usuarioRepository, validadorAposta) {
        this.apostaRepository = apostaRepository;
        this.eventoRepository = eventoRepository;
        this.usuarioRepository = usuarioRepository;
        this.validadorAposta = validadorAposta;
    }

    async executar({ userId, time, valor }) {
        // Buscar entidades
        const usuario = await this.usuarioRepository.buscarPorId(userId);
        const eventoAtivo = await this.eventoRepository.buscarEventoAtivo();
        
        // Criar objeto de domínio
        const aposta = new Aposta({ userId, time, valor, eventoId: eventoAtivo.id });
        
        // Validar com Domain Service
        this.validadorAposta.validar(aposta, usuario, eventoAtivo);
        
        // Persistir
        const apostaId = await this.apostaRepository.criar(aposta);
        
        return {
            sucesso: true,
            apostaId,
            mensagem: 'Aposta realizada com sucesso'
        };
    }
}

module.exports = CriarAposta;
```

**3. Controller:**
```javascript
// src/interface/http/controllers/ApostasController.js
class ApostasController {
    constructor(criarApostaUseCase) {
        this.criarApostaUseCase = criarApostaUseCase;
    }

    async criar(req, res, next) {
        try {
            const { time, valor } = req.body;
            const userId = req.session.userId;

            const resultado = await this.criarApostaUseCase.executar({ userId, time, valor });

            res.json(resultado);
        } catch (erro) {
            next(erro); // Passa para error handler middleware
        }
    }
}

module.exports = ApostasController;
```

**4. Route:**
```javascript
// src/interface/http/routes/apostas.routes.js
const express = require('express');
const { authentication } = require('../middlewares');
const { apostaValidator } = require('../validators');

module.exports = (apostasController) => {
    const router = express.Router();

    router.post(
        '/',
        authentication,
        apostaValidator.criar,
        (req, res, next) => apostasController.criar(req, res, next)
    );

    return router;
};
```

**Vantagens:**
- ✅ **Testabilidade**: Cada camada pode ser testada isoladamente
- ✅ **Manutenibilidade**: Responsabilidades claramente separadas
- ✅ **Reutilização**: `ValidadorAposta` pode ser usado em outros Use Cases
- ✅ **Independência**: Domain não depende de Express, SQLite, etc.
- ✅ **Escalabilidade**: Fácil adicionar novos Use Cases

---

## 🎯 6. BENEFÍCIOS DA REFATORAÇÃO

### 6.1 Benefícios Técnicos
- ✅ **Testabilidade**: 10x mais fácil testar lógica de negócio
- ✅ **Manutenibilidade**: Código organizado e fácil de encontrar
- ✅ **Escalabilidade**: Adicionar features sem quebrar código existente
- ✅ **Reutilização**: Domain Services podem ser usados em múltiplos Use Cases
- ✅ **Independência**: Domain Layer pode ser portado para outro framework

### 6.2 Benefícios para o Time
- ✅ **Onboarding**: Novos devs entendem arquitetura rapidamente
- ✅ **Produtividade**: Menos bugs, mais features
- ✅ **Qualidade**: Código mais limpo e documentado
- ✅ **Confiança**: Testes garantem que refatoração não quebra nada

### 6.3 Benefícios de Negócio
- ✅ **Time to Market**: Novas features mais rápidas
- ✅ **Menos Bugs**: Menos tempo corrigindo, mais tempo criando
- ✅ **Flexibilidade**: Fácil mudar banco de dados, adicionar API GraphQL, etc.
- ✅ **Futuro-Proof**: Arquitetura preparada para crescimento

---

## 🚀 7. PRÓXIMOS PASSOS

### 7.1 Aprovação da Proposta
1. Revisar este documento com o time
2. Aprovar estratégia de refatoração
3. Definir prioridades (quais módulos refatorar primeiro)
4. Estabelecer métricas de sucesso

### 7.2 Setup Inicial
1. Criar branch `feature/clean-architecture`
2. Criar estrutura de pastas `src/`
3. Configurar ferramentas (ESLint, Prettier, Husky)
4. Configurar alias de importação (`@/domain`, `@/application`, etc.)

### 7.3 Execução (3-4 semanas)
- **Semana 1:** Fases 1 e 2 (Domain Layer)
- **Semana 2:** Fases 3 e 4 (Infrastructure + Application)
- **Semana 3:** Fase 5 (Interface Layer)
- **Semana 4:** Fases 6 e 7 (Migração + Otimização)

### 7.4 Validação
- [ ] 100% dos testes atuais continuam passando
- [ ] Cobertura de testes ≥ 90%
- [ ] Performance igual ou melhor
- [ ] Documentação completa

---

## 📚 8. REFERÊNCIAS

### 8.1 Clean Architecture
- **Robert C. Martin** - "Clean Architecture: A Craftsman's Guide to Software Structure and Design"
- **Domain-Driven Design** - Eric Evans
- **SOLID Principles** - Uncle Bob

### 8.2 Padrões de Refatoração
- **Strangler Fig Pattern** - Martin Fowler
- **Repository Pattern**
- **Use Case Pattern**
- **Value Object Pattern**

### 8.3 Recursos Online
- [Clean Architecture in Node.js](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design in JavaScript](https://khalilstemmler.com/articles/domain-driven-design-intro/)
- [SOLID Principles Explained](https://www.digitalocean.com/community/conceptual_articles/s-o-l-i-d-the-first-five-principles-of-object-oriented-design)

---

## ✅ CONCLUSÃO

Este projeto tem uma **base sólida** (73 testes, lógica de negócio bem definida, documentação clara), mas sofre de **problemas arquiteturais clássicos** (código monolítico, acoplamento alto, lógica espalhada).

A refatoração proposta:
- ✅ **Não quebra funcionalidades** (refatoração incremental)
- ✅ **Mantém testes funcionando** (green all the way)
- ✅ **Melhora drasticamente manutenibilidade**
- ✅ **Prepara o projeto para crescimento futuro**

**Recomendação:** Iniciar refatoração imediatamente, seguindo a estratégia de Strangler Fig Pattern.

**Estimativa de Esforço:** 3-4 semanas (1 desenvolvedor full-time)  
**Risco:** Baixo (refatoração incremental com testes garantindo integridade)  
**Retorno:** Alto (código 10x mais sustentável)

---

**Aguardando aprovação para iniciar implementação via #tool:edit** 🚀
