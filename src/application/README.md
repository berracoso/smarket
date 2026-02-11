# 🎯 Application Layer (Use Cases)

## Visão Geral

A **Application Layer** contém os **Use Cases** (Casos de Uso), que são os orquestradores da lógica de negócio da aplicação. Cada Use Case representa uma ação específica que o usuário pode realizar no sistema.

Esta camada **depende** do Domain Layer e da Infrastructure Layer, mas **não conhece** detalhes de implementação da Interface Layer (Controllers, Routes).

## 📁 Estrutura

```
src/application/
└── use-cases/
    ├── autenticacao/
    │   ├── RegistrarUsuario.js         # Registro de novo usuário
    │   ├── FazerLogin.js               # Autenticação
    │   ├── FazerLogout.js              # Desconexão
    │   └── ObterUsuarioAtual.js        # Dados do usuário logado
    ├── apostas/
    │   ├── CriarAposta.js              # Nova aposta
    │   ├── ListarMinhasApostas.js      # Apostas do usuário
    │   ├── CalcularRetornoEstimado.js  # Simulação de retorno
    │   └── ObterHistoricoApostas.js    # Histórico completo
    └── eventos/
        ├── CriarNovoEvento.js          # Criar evento
        ├── ObterEventoAtivo.js         # Buscar evento ativo
        ├── AbrirFecharApostas.js       # Controlar apostas
        ├── DefinirVencedor.js          # Finalizar evento
        └── ResetarEvento.js            # Novo ciclo
```

---

## 🎯 Princípios dos Use Cases

### 1. **Orquestração, não Lógica de Negócio**
Use Cases **orquestram** chamadas para:
- Entities (Domain)
- Value Objects (Domain)
- Domain Services (Domain)
- Repositories (Infrastructure)

A **lógica de negócio** fica no Domain Layer, não nos Use Cases.

### 2. **Single Responsibility**
Cada Use Case tem **uma única responsabilidade**.

❌ **Errado:**
```javascript
class GerenciarApostasEEventos {
    executar() {
        // Faz muitas coisas diferentes
    }
}
```

✅ **Correto:**
```javascript
class CriarAposta { executar() { /* ... */ } }
class ListarApostas { executar() { /* ... */ } }
class CalcularRetorno { executar() { /* ... */ } }
```

### 3. **Dependency Injection**
Use Cases recebem dependências via construtor.

```javascript
class CriarAposta {
    constructor(apostaRepository, eventoRepository, usuarioRepository) {
        this.apostaRepository = apostaRepository;
        this.eventoRepository = eventoRepository;
        this.usuarioRepository = usuarioRepository;
    }
}
```

### 4. **DTOs (Data Transfer Objects)**
Use Cases retornam objetos simples (DTOs), não Entities.

```javascript
return {
    sucesso: true,
    usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email.toString() // Converte Value Object
    }
};
```

---

## 📚 Use Cases de Autenticação

### RegistrarUsuario

**Responsabilidade:** Criar novo usuário no sistema.

**Dependências:**
- `usuarioRepository` (Infrastructure)
- `bcryptHasher` (Infrastructure)

**Fluxo:**
1. Valida email e senha via Value Objects
2. Verifica se email já existe
3. Gera hash da senha
4. Cria entidade Usuario
5. Persiste no banco
6. Retorna DTO (sem senha)

**Exemplo de uso:**
```javascript
const useCase = new RegistrarUsuario(usuarioRepository, bcryptHasher);

const resultado = await useCase.executar({
    nome: 'João Silva',
    email: 'joao@teste.com',
    senha: 'senha123'
});

// resultado = { sucesso: true, usuario: { id: 1, nome: 'João Silva', ... } }
```

**Validações:**
- Email único (não pode estar cadastrado)
- Email válido (formato correto)
- Senha mínima de 6 caracteres
- Nome mínimo de 3 caracteres

---

### FazerLogin

**Responsabilidade:** Autenticar usuário.

**Dependências:**
- `usuarioRepository`
- `bcryptHasher`

**Fluxo:**
1. Valida email
2. Busca usuário no banco
3. Compara senha com hash
4. Retorna dados do usuário

**Exemplo de uso:**
```javascript
const useCase = new FazerLogin(usuarioRepository, bcryptHasher);

const resultado = await useCase.executar({
    email: 'joao@teste.com',
    senha: 'senha123'
});

// resultado = { sucesso: true, usuario: { id: 1, nome: 'João Silva', ... } }
```

**Erros:**
- `'Credenciais inválidas'` - Email não encontrado ou senha incorreta

---

### FazerLogout

**Responsabilidade:** Retornar sucesso (destruição de sessão é feita no Controller).

**Exemplo de uso:**
```javascript
const useCase = new FazerLogout();
const resultado = await useCase.executar();

// resultado = { sucesso: true, mensagem: 'Logout realizado com sucesso' }
```

---

### ObterUsuarioAtual

**Responsabilidade:** Buscar dados do usuário autenticado.

**Dependências:**
- `usuarioRepository`

**Exemplo de uso:**
```javascript
const useCase = new ObterUsuarioAtual(usuarioRepository);
const resultado = await useCase.executar(userId);

// resultado = { sucesso: true, usuario: { id: 1, nome: 'João Silva', ... } }
```

---

## 📚 Use Cases de Apostas

### CriarAposta

**Responsabilidade:** Criar nova aposta no evento ativo.

**Dependências:**
- `apostaRepository`
- `eventoRepository`
- `usuarioRepository`

**Fluxo:**
1. Busca usuário
2. Verifica permissão (Super Admin não pode apostar)
3. Busca evento ativo
4. Verifica se apostas estão abertas
5. Valida se o time existe no evento
6. Cria entidade Aposta (via Value Object ValorAposta)
7. Persiste

**Exemplo de uso:**
```javascript
const useCase = new CriarAposta(apostaRepo, eventoRepo, usuarioRepo);

const resultado = await useCase.executar({
    userId: 1,
    time: 'Time A',
    valor: 50
});

// resultado = { sucesso: true, aposta: { id: 1, time: 'Time A', valor: 50, ... } }
```

**Validações:**
- Usuário existe
- Usuário pode apostar (não é Super Admin)
- Evento ativo existe
- Apostas estão abertas
- Time existe no evento
- Valor mínimo R$ 1,00

---

### ListarMinhasApostas

**Responsabilidade:** Listar apostas do usuário no evento ativo.

**Dependências:**
- `apostaRepository`
- `eventoRepository`

**Exemplo de uso:**
```javascript
const useCase = new ListarMinhasApostas(apostaRepo, eventoRepo);
const resultado = await useCase.executar(userId);

// resultado = {
//   sucesso: true,
//   evento: { id: 1, nome: 'Campeonato 2026', ... },
//   apostas: [...],
//   totalApostado: 150.00
// }
```

---

### CalcularRetornoEstimado

**Responsabilidade:** Calcular retorno estimado de uma aposta simulada.

**Dependências:**
- `apostaRepository`
- `eventoRepository`

**Usa:** `CalculadoraPremios` (Domain Service)

**Exemplo de uso:**
```javascript
const useCase = new CalcularRetornoEstimado(apostaRepo, eventoRepo);

const resultado = await useCase.executar({
    time: 'Time A',
    valor: 50
});

// resultado = {
//   sucesso: true,
//   time: 'Time A',
//   valorAposta: 50,
//   retornoEstimado: 120.50,
//   lucroEstimado: 70.50,
//   ...
// }
```

---

### ObterHistoricoApostas

**Responsabilidade:** Listar histórico completo de apostas com paginação.

**Dependências:**
- `apostaRepository`
- `eventoRepository`

**Exemplo de uso:**
```javascript
const useCase = new ObterHistoricoApostas(apostaRepo, eventoRepo);

const resultado = await useCase.executar({
    userId: 1,
    eventoId: null, // Opcional
    limite: 20,
    pagina: 1
});

// resultado = {
//   sucesso: true,
//   apostas: [...],
//   paginacao: { paginaAtual: 1, totalPaginas: 5, ... },
//   estatisticas: { totalApostado: 500, totalApostas: 25, ... }
// }
```

---

## 📚 Use Cases de Eventos

### CriarNovoEvento

**Responsabilidade:** Criar novo evento (Admin/Super Admin).

**Dependências:**
- `eventoRepository`
- `usuarioRepository`

**Fluxo:**
1. Busca usuário
2. Verifica permissão (Admin ou Super Admin)
3. Valida times (2-10 times, sem duplicatas)
4. Cria entidade Evento
5. Persiste (arquiva eventos anteriores automaticamente)

**Exemplo de uso:**
```javascript
const useCase = new CriarNovoEvento(eventoRepo, usuarioRepo);

const resultado = await useCase.executar({
    userId: 1,
    nome: 'Campeonato 2026',
    times: ['Time A', 'Time B', 'Time C']
});

// resultado = { sucesso: true, evento: { id: 1, codigo: 'EVT-123', ... } }
```

---

### ObterEventoAtivo

**Responsabilidade:** Buscar evento ativo com estatísticas.

**Dependências:**
- `eventoRepository`
- `apostaRepository`

**Exemplo de uso:**
```javascript
const useCase = new ObterEventoAtivo(eventoRepo, apostaRepo);
const resultado = await useCase.executar();

// resultado = {
//   sucesso: true,
//   evento: { id: 1, nome: 'Campeonato 2026', ... },
//   estatisticas: {
//     totalApostas: 50,
//     totalArrecadado: 1000.00,
//     totalPorTime: { 'Time A': 300, 'Time B': 400, ... }
//   }
// }
```

---

### AbrirFecharApostas

**Responsabilidade:** Alternar estado das apostas (aberto/fechado).

**Dependências:**
- `eventoRepository`
- `usuarioRepository`

**Exemplo de uso:**
```javascript
const useCase = new AbrirFecharApostas(eventoRepo, usuarioRepo);

// Fechar apostas
const resultado = await useCase.executar({
    userId: 1,
    abrir: false
});

// resultado = { sucesso: true, apostasAbertas: false, mensagem: 'Apostas fechadas' }
```

---

### DefinirVencedor

**Responsabilidade:** Definir vencedor e calcular distribuição de prêmios.

**Dependências:**
- `eventoRepository`
- `apostaRepository`
- `usuarioRepository`

**Usa:** `CalculadoraPremios` (Domain Service)

**Fluxo:**
1. Busca usuário e verifica permissão
2. Busca evento ativo
3. Define vencedor (valida que apostas estão fechadas)
4. Busca todas as apostas
5. Calcula distribuição de prêmios
6. Finaliza evento (status → 'finalizado')
7. Salva no histórico

**Exemplo de uso:**
```javascript
const useCase = new DefinirVencedor(eventoRepo, apostaRepo, usuarioRepo);

const resultado = await useCase.executar({
    userId: 1,
    timeVencedor: 'Time A'
});

// resultado = {
//   sucesso: true,
//   resultado: {
//     eventoId: 1,
//     timeVencedor: 'Time A',
//     totalArrecadado: 1000.00,
//     totalPremios: 950.00,
//     taxaPlataforma: 50.00,
//     vencedores: [...],
//     quantidadeVencedores: 5
//   }
// }
```

---

### ResetarEvento

**Responsabilidade:** Arquivar evento atual e criar novo.

**Dependências:**
- `eventoRepository`
- `usuarioRepository`

**Exemplo de uso:**
```javascript
const useCase = new ResetarEvento(eventoRepo, usuarioRepo);

const resultado = await useCase.executar({
    userId: 1,
    nome: 'Novo Campeonato',
    times: ['Time A', 'Time B', 'Time C', 'Time D']
});

// resultado = {
//   sucesso: true,
//   eventoAntigoId: 1,
//   novoEvento: { id: 2, codigo: 'EVT-456', ... },
//   mensagem: 'Evento resetado com sucesso!'
// }
```

---

## ✅ Testes Unitários

**Localização:** `tests/unit/application/use-cases/`

### Estratégia de Testes

1. **Mock de Repositories**
   ```javascript
   const mockUsuarioRepository = {
       buscarPorEmail: jest.fn(),
       criar: jest.fn()
   };
   ```

2. **Testar Orquestração**
   - Verificar que os métodos corretos são chamados
   - Verificar ordem de execução
   - Verificar tratamento de erros

3. **Não Testar Lógica do Domain**
   - Domain Layer já tem testes próprios
   - Use Cases apenas orquestram

4. **Testar DTOs**
   - Verificar estrutura do retorno
   - Garantir que senha não é exposta
   - Verificar conversão de Value Objects

### Exemplo de Teste

```javascript
describe('Use Case: RegistrarUsuario', () => {
    test('Deve registrar novo usuário com sucesso', async () => {
        mockUsuarioRepository.buscarPorEmail.mockResolvedValue(null);
        mockBcryptHasher.hash.mockResolvedValue('$2b$10$hash');
        mockUsuarioRepository.criar.mockResolvedValue(1);

        const resultado = await useCase.executar({
            nome: 'João Silva',
            email: 'joao@teste.com',
            senha: 'senha123'
        });

        expect(resultado.sucesso).toBe(true);
        expect(mockUsuarioRepository.criar).toHaveBeenCalled();
    });
});
```

### Cobertura Atual

**RegistrarUsuario:**
- ✅ 9 testes passando
- ✅ Testa sucesso, validações e integração

**Executar testes:**
```bash
npm test -- tests/unit/application/
```

---

## 🔗 Integração com Outras Camadas

### Domain Layer ⬆️
Use Cases **usam** Domain Layer:
- Entities (Usuario, Evento, Aposta)
- Value Objects (Email, Senha, ValorAposta)
- Domain Services (CalculadoraPremios, ValidadorPermissoes)

### Infrastructure Layer ⬆️
Use Cases **usam** Infrastructure Layer:
- Repositories (SQLiteUsuarioRepository, etc)
- Security (BcryptHasher, SessionManager)

### Interface Layer ⬇️
Interface Layer **usa** Use Cases:
- Controllers instanciam e executam Use Cases
- Controllers não contêm lógica de negócio

---

## 📊 Diagrama de Fluxo

```
Controller (Interface)
    ↓ chama
Use Case (Application)
    ↓ usa
Domain Layer (Business Logic)
    ↓ persiste via
Infrastructure Layer (Repositories)
    ↓ armazena em
Database (SQLite)
```

---

## 🚀 Próximos Passos

1. **Interface Layer (Controllers)**
   - Criar AuthController
   - Criar ApostasController
   - Criar EventosController

2. **Dependency Injection Container**
   - Instanciar Use Cases
   - Injetar dependências
   - Fornecer via factory

3. **Migração Gradual**
   - Substituir lógica do server.js
   - Manter compatibilidade
   - Testes E2E

---

**Última Atualização:** 2026-01-19  
**Status:** Application Layer Implementado ✅  
**Cobertura:** 13 Use Cases + 9 testes (expandindo)
