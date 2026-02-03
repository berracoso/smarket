# 📦 Domain Layer - Bolão Privado

Esta camada contém a **lógica de negócio pura** da aplicação, independente de frameworks, bancos de dados ou bibliotecas externas.

## 🎯 Princípios

- ✅ **Framework Agnostic**: Não depende de Express, SQLite, bcrypt, etc.
- ✅ **Testável**: Todos os módulos podem ser testados isoladamente
- ✅ **Reutilizável**: Pode ser portado para outros projetos Node.js
- ✅ **SOLID Compliant**: Segue os princípios SOLID

---

## 📁 Estrutura

```
src/domain/
├── value-objects/       # Objetos de valor imutáveis
│   ├── Email.js
│   ├── Senha.js
│   ├── ValorAposta.js
│   └── TaxaPlataforma.js
│
├── entities/            # Entidades de domínio
│   ├── Usuario.js
│   ├── Evento.js
│   └── Aposta.js
│
├── services/            # Serviços de domínio
│   ├── CalculadoraProbabilidade.js
│   ├── CalculadoraPremios.js
│   └── ValidadorPermissoes.js
│
└── repositories/        # Interfaces de repositórios
    ├── IUsuarioRepository.js
    ├── IEventoRepository.js
    └── IApostaRepository.js
```

---

## 🔷 Value Objects

### Email

Representa um endereço de e-mail válido.

**Regras:**
- Formato válido de e-mail
- Convertido para minúsculas
- Não pode ser vazio

**Uso:**
```javascript
const Email = require('./src/domain/value-objects/Email');

const email = new Email('usuario@exemplo.com');
console.log(email.toString()); // 'usuario@exemplo.com'

// Comparação
const email2 = new Email('usuario@exemplo.com');
console.log(email.equals(email2)); // true

// Validação automática
const emailInvalido = new Email('usuario'); // ❌ Throw: 'Formato de e-mail inválido'
```

---

### Senha

Representa uma senha com validação de tamanho mínimo.

**Regras:**
- Mínimo de 6 caracteres
- Não pode ser vazia

**Uso:**
```javascript
const Senha = require('./src/domain/value-objects/Senha');

const senha = new Senha('minhasenha123');
console.log(senha.tamanho); // 13

// Validação automática
const senhaInvalida = new Senha('12345'); // ❌ Throw: 'Senha deve ter no mínimo 6 caracteres'
```

---

### ValorAposta

Representa o valor monetário de uma aposta.

**Regras:**
- Valor mínimo: R$ 1.00
- Arredondamento para 2 casas decimais
- Deve ser um número positivo

**Uso:**
```javascript
const ValorAposta = require('./src/domain/value-objects/ValorAposta');

const valor = new ValorAposta(100.50);
console.log(valor.toFloat());       // 100.50
console.log(valor.toString());      // '100.50'
console.log(valor.formatarBRL());   // 'R$ 100,50'

// Operações
const valor2 = new ValorAposta(50);
const soma = valor.somar(valor2);
console.log(soma.toFloat()); // 150.50

// Validação automática
const valorInvalido = new ValorAposta(0.50); // ❌ Throw: 'Valor mínimo da aposta é R$ 1,00'
```

---

### TaxaPlataforma

Representa a taxa cobrada pela plataforma.

**Regras:**
- Taxa padrão: 5% (0.05)
- Deve estar entre 0 e 1 (0% a 100%)

**Uso:**
```javascript
const TaxaPlataforma = require('./src/domain/value-objects/TaxaPlataforma');

const taxa = new TaxaPlataforma(); // Padrão: 5%
console.log(taxa.toFloat());              // 0.05
console.log(taxa.percentualFormatado);    // '5%'

// Cálculos
console.log(taxa.calcularTaxa(100));            // 5
console.log(taxa.calcularPremioLiquido(100));   // 95

// Taxa customizada
const taxa10 = new TaxaPlataforma(0.10); // 10%
console.log(taxa10.calcularPremioLiquido(1000)); // 900
```

---

## 🔶 Entities

### Usuario

Representa um usuário do sistema.

**Tipos:**
- `usuario`: Pode fazer apostas
- `admin`: Pode gerenciar eventos e fazer apostas
- `superadmin`: Pode gerenciar usuários e eventos, mas **NÃO** pode apostar

**Uso:**
```javascript
const Usuario = require('./src/domain/entities/Usuario');

// Criar usuário comum
const usuario = new Usuario({
    id: 1,
    nome: 'João Silva',
    email: 'joao@teste.com',
    senha: 'senha123'
});

console.log(usuario.tipo);                  // 'usuario'
console.log(usuario.podeApostar());         // true
console.log(usuario.podeGerenciarEventos()); // false
console.log(usuario.podeGerenciarUsuarios()); // false

// Criar admin
const admin = new Usuario({
    id: 2,
    nome: 'Admin',
    email: 'admin@teste.com',
    senha: 'senha123',
    isAdmin: true
});

console.log(admin.tipo);                    // 'admin'
console.log(admin.podeApostar());           // true
console.log(admin.podeGerenciarEventos());  // true

// Promoção/Rebaixamento
usuario.promoverParaAdmin();
console.log(usuario.tipo); // 'admin'

admin.rebaixarParaUsuario();
console.log(admin.tipo); // 'usuario'

// Serialização
console.log(usuario.toJSON());
// {
//   id: 1,
//   nome: 'João Silva',
//   email: 'joao@teste.com',
//   isAdmin: true,
//   isSuperAdmin: false,
//   tipo: 'admin',
//   criadoEm: '2026-01-19T...'
// }
```

---

### Evento

Representa um evento de apostas.

**Status:**
- `ativo`: Evento atual (pode estar aberto ou fechado)
- `finalizado`: Evento encerrado com vencedor
- `arquivado`: Evento antigo

**Regras:**
- Mínimo de 2 times, máximo de 10
- Sem times duplicados
- Vencedor só pode ser definido se apostas estiverem fechadas

**Uso:**
```javascript
const Evento = require('./src/domain/entities/Evento');

// Criar evento
const evento = new Evento({
    id: 1,
    codigo: 'evento-123',
    nome: 'Campeonato 2026',
    times: ['Time A', 'Time B', 'Time C', 'Time D']
});

console.log(evento.estaAberto());  // true
console.log(evento.estaAtivo());   // true

// Gerenciar apostas
evento.fechar();
console.log(evento.aberto); // false

evento.abrir();
console.log(evento.aberto); // true

// Definir vencedor
evento.fechar(); // Precisa fechar antes
evento.definirVencedor('Time A');
console.log(evento.vencedor); // 'Time A'
console.log(evento.status);   // 'finalizado'

// Verificações
console.log(evento.contemTime('Time A')); // true
console.log(evento.contemTime('Time Z')); // false

// Arquivar
evento.arquivar();
console.log(evento.status); // 'arquivado'
```

---

### Aposta

Representa uma aposta feita por um usuário.

**Regras:**
- Valor mínimo: R$ 1.00 (via ValorAposta)
- Vinculada a um usuário e evento
- Imutável após criação

**Uso:**
```javascript
const Aposta = require('./src/domain/entities/Aposta');

const aposta = new Aposta({
    id: 1,
    userId: 10,
    eventoId: 5,
    nome: 'João Silva',
    time: 'Time A',
    valor: 100.50
});

// Verificações
console.log(aposta.pertenceAoUsuario(10));  // true
console.log(aposta.pertenceAoEvento(5));    // true
console.log(aposta.getValorNumerico());     // 100.50

// Serialização
console.log(aposta.toJSON());
// {
//   id: 1,
//   userId: 10,
//   eventoId: 5,
//   nome: 'João Silva',
//   time: 'Time A',
//   valor: 100.50,
//   timestamp: '2026-01-19T...'
// }
```

---

## 🛠️ Domain Services

### CalculadoraProbabilidade

Calcula probabilidades baseadas no volume de apostas (modelo Pari-Mutuel).

**Uso:**
```javascript
const CalculadoraProbabilidade = require('./src/domain/services/CalculadoraProbabilidade');

const calculadora = new CalculadoraProbabilidade();

const apostas = [
    { time: 'Time A', valor: 300 },
    { time: 'Time B', valor: 150 },
    { time: 'Time C', valor: 50 }
];

const times = ['Time A', 'Time B', 'Time C'];
const probabilidades = calculadora.calcular(apostas, times);

console.log(probabilidades);
// {
//   'Time A': { total: 300, probabilidade: 0.6, percentual: '60.00' },
//   'Time B': { total: 150, probabilidade: 0.3, percentual: '30.00' },
//   'Time C': { total: 50, probabilidade: 0.1, percentual: '10.00' }
// }

// Calcular probabilidade de um time específico
const probA = calculadora.calcularProbabilidadeTime(apostas, 'Time A');
console.log(probA); // 0.6 (60%)
```

---

### CalculadoraPremios

Calcula distribuição de prêmios entre vencedores.

**Fórmulas:**
- `Total Prêmio = Total Geral × (1 - Taxa)`
- `Ganho = (Valor Apostado / Total Time Vencedor) × Total Prêmio`
- `Lucro = Ganho - Valor Apostado`

**Uso:**
```javascript
const CalculadoraPremios = require('./src/domain/services/CalculadoraPremios');

const calculadora = new CalculadoraPremios(0.05); // Taxa 5%

const apostas = [
    { time: 'Time A', valor: 100, nome: 'João' },
    { time: 'Time A', valor: 200, nome: 'Maria' },
    { time: 'Time B', valor: 300, nome: 'Pedro' }
];

// Calcular retorno estimado
const retorno = calculadora.calcularRetornoEstimado(apostas, 'Time A', 50);
console.log(retorno); // Retorno se apostar R$ 50 no Time A

// Distribuir prêmios entre vencedores
const vencedores = calculadora.calcularDistribuicao(apostas, 'Time A');
console.log(vencedores);
// [
//   { nome: 'João', apostado: 100, ganho: 190, lucro: 90 },
//   { nome: 'Maria', apostado: 200, ganho: 380, lucro: 180 }
// ]

// Calcular resumo completo
const evento = {
    times: ['Time A', 'Time B'],
    aberto: true,
    vencedor: null
};

const resumo = calculadora.calcularResumo(apostas, evento);
console.log(resumo);
// {
//   totalGeral: 600,
//   taxaPlataforma: 30,
//   totalPremio: 570,
//   percentualTaxa: '5%',
//   times: {
//     'Time A': { total: 300, probabilidade: 0.5, percentual: '50.00' },
//     'Time B': { total: 300, probabilidade: 0.5, percentual: '50.00' }
//   },
//   aberto: true,
//   vencedor: null
// }
```

---

### ValidadorPermissoes

Valida permissões de usuários baseado em seus tipos/roles.

**Uso:**
```javascript
const ValidadorPermissoes = require('./src/domain/services/ValidadorPermissoes');

const validador = new ValidadorPermissoes();

const usuario = { id: 1, isAdmin: false, isSuperAdmin: false };
const admin = { id: 2, isAdmin: true, isSuperAdmin: false };
const superAdmin = { id: 3, isAdmin: false, isSuperAdmin: true };

// Verificar permissões de apostas
console.log(validador.podeApostar(usuario));     // true
console.log(validador.podeApostar(admin));       // true
console.log(validador.podeApostar(superAdmin));  // false ❌

// Verificar permissões de eventos
console.log(validador.podeGerenciarEventos(usuario));     // false
console.log(validador.podeGerenciarEventos(admin));       // true
console.log(validador.podeGerenciarEventos(superAdmin));  // true

// Verificar permissões de usuários
console.log(validador.podeGerenciarUsuarios(usuario));     // false
console.log(validador.podeGerenciarUsuarios(admin));       // false
console.log(validador.podeGerenciarUsuarios(superAdmin));  // true

// Validar promoção
try {
    validador.podePromoverUsuario(superAdmin, usuario); // ✅ OK
    validador.podePromoverUsuario(admin, usuario);      // ❌ Throw
} catch (erro) {
    console.log(erro.message); // 'Apenas Super Admin pode promover usuários'
}

// Validar ação em evento
validador.validarAcaoEvento(admin, 'abrir');    // ✅ OK
validador.validarAcaoEvento(usuario, 'abrir');  // ❌ Throw
```

---

## 🔌 Repository Interfaces

Definem contratos para persistência de dados. As implementações concretas ficam na camada **Infrastructure**.

### IUsuarioRepository

```javascript
const IUsuarioRepository = require('./src/domain/repositories/IUsuarioRepository');

// A implementação concreta (ex: SQLiteUsuarioRepository) deve implementar:
// - buscarPorId(id)
// - buscarPorEmail(email)
// - listarTodos()
// - criar(usuario)
// - atualizar(id, dados)
// - excluir(id)
// - promoverParaAdmin(id)
// - rebaixarParaUsuario(id)
```

### IEventoRepository

```javascript
// Métodos:
// - buscarPorId(id)
// - buscarPorCodigo(codigo)
// - buscarEventoAtivo()
// - listarTodos(filtros)
// - criar(evento)
// - atualizar(id, dados)
// - abrirApostas(id)
// - fecharApostas(id)
// - definirVencedor(id, vencedor)
// - arquivar(id)
```

### IApostaRepository

```javascript
// Métodos:
// - buscarPorId(id)
// - listarPorUsuario(userId, filtros)
// - listarPorEvento(eventoId)
// - listarPorUsuarioEEvento(userId, eventoId)
// - criar(aposta)
// - contarPorUsuario(userId)
// - calcularTotalPorUsuario(userId)
```

---

## ✅ Testes

Todos os módulos possuem **testes unitários completos** em `tests/unit/domain/`.

**Executar testes:**
```bash
npm test -- tests/unit/domain/
```

**Cobertura:**
- Value Objects: 50+ testes
- Entities: 60+ testes
- Services: 30+ testes

**Total: ~140 testes unitários**

---

## 📊 Diagrama de Dependências

```
┌─────────────────────────────────────┐
│     Domain Services                 │
│  (CalculadoraPremios, etc.)         │
└───────────┬─────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│        Entities                     │
│  (Usuario, Evento, Aposta)          │
└───────────┬─────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│     Value Objects                   │
│  (Email, Senha, ValorAposta)        │
└─────────────────────────────────────┘
```

**Regras:**
- ✅ Domain Services podem usar Entities e Value Objects
- ✅ Entities podem usar Value Objects
- ✅ Value Objects não dependem de nada (imutáveis e independentes)
- ❌ Domain Layer **NÃO** depende de frameworks externos

---

## 🚀 Próximos Passos

1. **Infrastructure Layer**: Implementar repositories concretos (SQLite)
2. **Application Layer**: Criar Use Cases (CriarAposta, DefinirVencedor, etc.)
3. **Interface Layer**: Controllers e Routes do Express

---

## 📚 Referências

- **Clean Architecture** - Robert C. Martin
- **Domain-Driven Design** - Eric Evans
- **Pari-Mutuel Betting** - Sistema de apostas mútuas
- **Value Object Pattern** - Martin Fowler

---

**Desenvolvido com ❤️ seguindo princípios de Clean Architecture e SOLID**
