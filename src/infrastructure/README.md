# 🏗️ Infrastructure Layer

## Visão Geral

A **Infrastructure Layer** implementa os detalhes técnicos concretos da aplicação, incluindo persistência de dados, segurança e configurações. Esta camada **depende do Domain Layer** para conhecer as interfaces (contratos), mas o Domain **não conhece** a Infrastructure (inversão de dependência).

## 📁 Estrutura

```
src/infrastructure/
├── database/
│   └── sqlite.js                    # Singleton de conexão SQLite
├── repositories/
│   ├── SQLiteUsuarioRepository.js   # Implementação concreta
│   ├── SQLiteEventoRepository.js    # Implementação concreta
│   └── SQLiteApostaRepository.js    # Implementação concreta
├── security/
│   ├── BcryptHasher.js              # Serviço de hash de senhas
│   └── SessionManager.js            # Gerenciamento de sessões
└── config/
    └── (container.js - futuro)      # Dependency Injection
```

---

## 📦 Database Layer

### SQLiteConnection (`database/sqlite.js`)

**Responsabilidade:** Gerenciar a conexão única com SQLite (Singleton Pattern).

**Métodos:**
- `getConnection()` - Retorna conexão ativa (cria se não existir)
- `close()` - Fecha conexão com banco
- `run(sql, params)` - Executa query com parâmetros (Promise)
- `get(sql, params)` - Busca uma única linha (Promise)
- `all(sql, params)` - Busca múltiplas linhas (Promise)

**Exemplo de uso:**
```javascript
const db = require('./infrastructure/database/sqlite');

const usuario = await db.get('SELECT * FROM usuarios WHERE id = ?', [1]);
const result = await db.run('INSERT INTO usuarios (nome, email) VALUES (?, ?)', ['João', 'joao@teste.com']);
```

---

## 📚 Repositories Layer

### SQLiteUsuarioRepository

**Implementa:** `IUsuarioRepository` (Domain)

**Métodos:**
- `buscarPorId(id)` → `Promise<Usuario|null>`
- `buscarPorEmail(email)` → `Promise<Usuario|null>`
- `criar(usuario)` → `Promise<number>` (retorna ID)
- `atualizar(usuario)` → `Promise<boolean>`
- `listarTodos()` → `Promise<Usuario[]>`
- `excluir(id)` → `Promise<boolean>`

**Características:**
- Mapeia linhas do banco para entidades `Usuario`
- Converte email para minúsculas automaticamente
- Converte `isAdmin` e `isSuperAdmin` de INTEGER (0/1) para boolean

**Exemplo de uso:**
```javascript
const repository = new SQLiteUsuarioRepository(db);

// Criar
const usuario = new Usuario({ nome: 'João', email: 'joao@teste.com', senha: 'hash123' });
const id = await repository.criar(usuario);

// Buscar
const usuarioBuscado = await repository.buscarPorEmail('joao@teste.com');

// Atualizar
usuarioBuscado.promoverParaAdmin();
await repository.atualizar(usuarioBuscado);
```

---

### SQLiteEventoRepository

**Implementa:** `IEventoRepository` (Domain)

**Métodos:**
- `buscarPorId(id)` → `Promise<Evento|null>`
- `buscarEventoAtivo()` → `Promise<Evento|null>` (apenas 1 ativo por vez)
- `criar(evento)` → `Promise<number>` (arquiva eventos anteriores)
- `atualizar(evento)` → `Promise<boolean>`
- `finalizar(id)` → `Promise<boolean>`
- `arquivar(id)` → `Promise<boolean>`
- `salvarHistorico(evento, totalArrecadado, totalPremios)` → `Promise<number>`
- `listarHistorico(limite)` → `Promise<Array>`

**Regra de Negócio Implementada:**
- Ao criar novo evento, **arquiva automaticamente** todos os eventos ativos anteriores
- Apenas **1 evento ativo** por vez
- Times são armazenados como JSON no banco

**Exemplo de uso:**
```javascript
const repository = new SQLiteEventoRepository(db);

// Buscar evento ativo
const eventoAtivo = await repository.buscarEventoAtivo();

// Criar novo (arquiva anteriores)
const novoEvento = new Evento({ nome: 'Campeonato 2026', times: ['Time A', 'Time B'] });
const id = await repository.criar(novoEvento);

// Finalizar e salvar histórico
await repository.finalizar(eventoAtivo.id);
await repository.salvarHistorico(eventoAtivo, 1000, 950);
```

---

### SQLiteApostaRepository

**Implementa:** `IApostaRepository` (Domain)

**Métodos:**
- `buscarPorId(id)` → `Promise<Aposta|null>`
- `criar(aposta)` → `Promise<number>`
- `listarPorUsuarioEEvento(userId, eventoId)` → `Promise<Aposta[]>`
- `listarPorEvento(eventoId)` → `Promise<Aposta[]>`
- `listarPorUsuario(userId, filtros)` → `Promise<Aposta[]>`
- `calcularTotalPorTime(eventoId, time)` → `Promise<number>`
- `calcularTotalArrecadado(eventoId)` → `Promise<number>`
- `contarPorEvento(eventoId)` → `Promise<number>`
- `obterResumoPorTime(eventoId)` → `Promise<Array>`

**Características:**
- Mapeia `valor` (number) para `ValorAposta` (Value Object)
- Fornece métodos agregados (SUM, COUNT) para cálculos
- Suporta filtros opcionais (time, limite, etc)

**Exemplo de uso:**
```javascript
const repository = new SQLiteApostaRepository(db);

// Criar aposta
const aposta = new Aposta({
    userId: 1,
    eventoId: 5,
    eventoNome: 'Campeonato 2026',
    nome: 'João',
    time: 'Time A',
    valor: 50
});
await repository.criar(aposta);

// Calcular totais
const totalTime = await repository.calcularTotalPorTime(5, 'Time A'); // 150
const totalEvento = await repository.calcularTotalArrecadado(5); // 1000

// Resumo por time
const resumo = await repository.obterResumoPorTime(5);
// [{ time: 'Time A', quantidadeApostas: 5, totalApostado: 150 }, ...]
```

---

## 🔒 Security Layer

### BcryptHasher (`security/BcryptHasher.js`)

**Responsabilidade:** Encapsular lógica de hash de senhas usando bcrypt.

**Métodos:**
- `hash(senha)` → `Promise<string>` (gera hash com salt)
- `compare(senha, hash)` → `Promise<boolean>` (valida senha)
- `validarForca(senha)` → `boolean` (mínimo 6 caracteres)

**Configuração:**
- Salt rounds: 10 (padrão)

**Exemplo de uso:**
```javascript
const hasher = new BcryptHasher();

// No registro
const senha = 'senha123';
const hash = await hasher.hash(senha);
// $2b$10$... (60 caracteres)

// No login
const senhaCorreta = await hasher.compare('senha123', hash); // true
const senhaErrada = await hasher.compare('senha456', hash); // false
```

---

### SessionManager (`security/SessionManager.js`)

**Responsabilidade:** Gerenciar sessões do Express usando `express-session`.

**Métodos:**
- `getMiddleware()` → Middleware do express-session configurado
- `criarSessao(req, userId, userData)` → Cria sessão para usuário
- `obterUsuario(req)` → `Object|null` (dados do usuário logado)
- `estaAutenticado(req)` → `boolean`
- `destruirSessao(req)` → `Promise<void>` (logout)
- `regenerarSessao(req)` → `Promise<void>` (previne session fixation)

**Configuração padrão:**
```javascript
{
    secret: 'bolao-privado-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,      // true em produção (HTTPS)
        httpOnly: true,
        maxAge: 86400000    // 24 horas
    },
    name: 'bolao.sid'
}
```

**Exemplo de uso:**
```javascript
const sessionManager = new SessionManager();

// No server.js
app.use(sessionManager.getMiddleware());

// No controller de login
sessionManager.criarSessao(req, usuario.id, {
    nome: usuario.nome,
    email: usuario.email.toString(),
    tipo: usuario.tipo
});

// Em middleware de autenticação
if (!sessionManager.estaAutenticado(req)) {
    return res.status(401).json({ erro: 'Não autenticado' });
}

// No logout
await sessionManager.destruirSessao(req);
```

---

## ✅ Testes de Integração

**Localização:** `tests/integration/infrastructure/repositories/`

### SQLiteUsuarioRepository.test.js

**Cobertura:** 14 testes
- ✅ Criar usuário, admin, super admin
- ✅ Buscar por ID e email (case-insensitive)
- ✅ Atualizar e excluir usuários
- ✅ Listar todos os usuários

**Estratégia:**
- Usa banco SQLite **em memória** (`:memory:`)
- Cria tabela `usuarios` antes de cada teste
- Mock do database com métodos Promise
- Fecha conexão após cada teste

**Executar:**
```bash
npm test -- tests/integration/infrastructure/
```

**Resultado Esperado:**
```
Test Suites: 1 passed, 1 total
Tests:       14 passed, 14 total
Time:        ~1.2s
```

---

## 🔗 Integração com Domain Layer

### Inversão de Dependência (SOLID)

**Domain define contratos (interfaces):**
```javascript
// src/domain/repositories/IUsuarioRepository.js
class IUsuarioRepository {
    async buscarPorId(id) { throw new Error('Não implementado'); }
    async criar(usuario) { throw new Error('Não implementado'); }
    // ...
}
```

**Infrastructure implementa contratos:**
```javascript
// src/infrastructure/repositories/SQLiteUsuarioRepository.js
class SQLiteUsuarioRepository extends IUsuarioRepository {
    async buscarPorId(id) {
        // Implementação concreta usando SQLite
    }
}
```

**Vantagens:**
- Domain **não conhece** SQLite, PostgreSQL, MongoDB, etc
- Fácil trocar de banco de dados
- Testável com mocks

---

## 📊 Diagrama de Dependências

```
┌─────────────────────────────────────────────┐
│         Domain Layer (Independente)         │
│  - Entities                                 │
│  - Value Objects                            │
│  - Repository Interfaces (contratos)        │
└─────────────────────────────────────────────┘
                    ▲
                    │ Depende (conhece as interfaces)
                    │
┌─────────────────────────────────────────────┐
│       Infrastructure Layer (Concreta)       │
│  - SQLiteUsuarioRepository                  │
│  - SQLiteEventoRepository                   │
│  - SQLiteApostaRepository                   │
│  - BcryptHasher                             │
│  - SessionManager                           │
└─────────────────────────────────────────────┘
```

---

## 🚀 Próximos Passos

### ⏳ Pendente:

1. **Application Layer (Use Cases)**
   - `RegistrarUsuario.js`
   - `FazerLogin.js`
   - `CriarAposta.js`
   - `DefinirVencedor.js`

2. **Interface Layer (Controllers e Routes)**
   - `AuthController.js`
   - `ApostasController.js`
   - `EventosController.js`

3. **Dependency Injection Container**
   - `src/infrastructure/config/container.js`
   - Instanciar e conectar todas as dependências

---

## 📚 Referências

- [Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [SQLite Node.js](https://github.com/TryGhost/node-sqlite3)
- [bcrypt.js](https://github.com/kelektiv/node.bcrypt.js)
- [express-session](https://github.com/expressjs/session)

---

**Última Atualização:** 2026-01-19  
**Status:** Infrastructure Layer Implementado ✅  
**Cobertura:** Domain (136 testes) + Infrastructure (14 testes) = **150 testes passando**
