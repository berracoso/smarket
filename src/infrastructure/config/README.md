# 🏗️ Dependency Injection Container

## 📋 Visão Geral

O **Container de Injeção de Dependências** é o componente responsável por instanciar e gerenciar todas as dependências da aplicação, garantindo que as camadas da Clean Architecture permaneçam desacopladas e testáveis.

## 🎯 Responsabilidades

1. **Instanciar** todas as dependências na ordem correta
2. **Gerenciar** o ciclo de vida dos objetos (Singleton)
3. **Resolver** dependências transitivas automaticamente
4. **Fornecer** acesso centralizado a todas as instâncias

## 📦 Dependências Registradas (33)

### 1. Database Layer
- `db` - Conexão SQLite (Singleton)

### 2. Infrastructure Layer - Repositories
- `usuarioRepository` - SQLiteUsuarioRepository
- `eventoRepository` - SQLiteEventoRepository
- `apostaRepository` - SQLiteApostaRepository

### 3. Infrastructure Layer - Security
- `bcryptHasher` - BcryptHasher (hash de senhas)
- `sessionManager` - SessionManager (gerenciamento de sessões)

### 4. Application Layer - Use Cases (13)

#### Autenticação (4)
- `registrarUsuario` - RegistrarUsuario
- `fazerLogin` - FazerLogin
- `fazerLogout` - FazerLogout
- `obterUsuarioAtual` - ObterUsuarioAtual

#### Apostas (4)
- `criarAposta` - CriarAposta
- `listarMinhasApostas` - ListarMinhasApostas
- `calcularRetornoEstimado` - CalcularRetornoEstimado
- `obterHistoricoApostas` - ObterHistoricoApostas

#### Eventos (5)
- `criarNovoEvento` - CriarNovoEvento
- `obterEventoAtivo` - ObterEventoAtivo
- `abrirFecharApostas` - AbrirFecharApostas
- `definirVencedor` - DefinirVencedor
- `resetarEvento` - ResetarEvento

### 5. Interface Layer - Middlewares (7)
- `authMiddleware` - AuthenticationMiddleware (instância)
- `authzMiddleware` - AuthorizationMiddleware (instância)
- `errorHandler` - Error Handler Middleware
- `requireAuth` - Middleware de autenticação obrigatória
- `optionalAuth` - Middleware de autenticação opcional
- `requireAdmin` - Middleware de autorização (Admin)
- `requireSuperAdmin` - Middleware de autorização (Super Admin)
- `canBet` - Middleware de permissão para apostar

### 6. Interface Layer - Controllers (3)
- `authController` - AuthController
- `apostasController` - ApostasController
- `eventosController` - EventosController

### 7. Interface Layer - Routes (3)
- `authRoutes` - Express Router de autenticação
- `apostasRoutes` - Express Router de apostas
- `eventosRoutes` - Express Router de eventos

## 🔄 Ordem de Inicialização

O container inicializa as dependências na seguinte ordem:

```
1. Database (SQLite Connection)
   ↓
2. Repositories (Infrastructure Layer)
   ↓
3. Security (Hasher + SessionManager)
   ↓
4. Use Cases (Application Layer)
   ↓
5. Middlewares (Interface Layer)
   ↓
6. Controllers (Interface Layer)
   ↓
7. Routes (Interface Layer)
```

## 📚 Uso

### Importar o Container

```javascript
const container = require('./src/infrastructure/config/container');
```

### Obter uma Dependência

```javascript
// Obter um Use Case
const registrarUsuario = container.get('registrarUsuario');

// Obter um Controller
const authController = container.get('authController');

// Obter um Repository
const usuarioRepository = container.get('usuarioRepository');
```

### Verificar se Existe

```javascript
if (container.has('db')) {
    console.log('Database disponível');
}
```

### Listar Todas as Dependências

```javascript
const dependencias = container.list();
console.log(dependencias); // Array com 33 nomes
```

### Obter Todas as Instâncias

```javascript
const instancias = container.getAll();
// Retorna objeto com todas as 33 dependências
```

## 🏗️ Arquitetura

### Pattern: Singleton

O container é exportado como uma **instância única**, garantindo que todas as partes da aplicação compartilhem as mesmas dependências.

```javascript
class Container {
    constructor() {
        this.instances = {};
        this._initialize();
    }
    // ...
}

module.exports = new Container(); // Singleton
```

### Pattern: Factory

O container atua como uma **Factory** que cria e gerencia todas as instâncias.

```javascript
_setupUseCases() {
    this.instances.registrarUsuario = new RegistrarUsuario(
        this.instances.usuarioRepository,
        this.instances.bcryptHasher
    );
}
```

### Pattern: Service Locator

Através do método `get()`, o container atua como um **Service Locator**.

```javascript
const authController = container.get('authController');
```

## ✅ Vantagens

1. **Desacoplamento**: Camadas não conhecem implementações concretas
2. **Testabilidade**: Fácil substituir dependências por mocks
3. **Manutenibilidade**: Centralização da configuração
4. **Flexibilidade**: Fácil adicionar/remover dependências
5. **Rastreabilidade**: Lista completa de dependências em um lugar

## 🧪 Testes

O container é testado indiretamente através dos **230 testes** existentes que continuam passando após sua implementação.

### Teste Manual

```bash
node -e "const c = require('./src/infrastructure/config/container'); console.log(c.list());"
```

### Teste de Carregamento

```javascript
const container = require('./src/infrastructure/config/container');

console.log('✅ Container carregado');
console.log(`📦 ${container.list().length} dependências registradas`);
```

## 📋 Checklist de Dependências

- [x] Database Connection (1)
- [x] Repositories (3)
- [x] Security Services (2)
- [x] Use Cases - Autenticação (4)
- [x] Use Cases - Apostas (4)
- [x] Use Cases - Eventos (5)
- [x] Middlewares (7)
- [x] Controllers (3)
- [x] Routes (3)

**Total: 33 dependências** ✅

## 🚀 Próximos Passos

Agora que o container está pronto, o próximo passo é criar o **novo server.js** que utilizará essas dependências para iniciar a aplicação.

## 📖 Referências

- [Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Dependency Injection Pattern](https://martinfowler.com/articles/injection.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)

---

**Status:** ✅ Completo  
**Última Atualização:** 2026-01-19  
**Testes:** 230 passando
