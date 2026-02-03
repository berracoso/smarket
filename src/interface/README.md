# 🌐 Interface Layer (HTTP)

## Visão Geral

A **Interface Layer** é responsável por **receber requisições HTTP**, **validar entrada**, **executar Use Cases** e **retornar respostas formatadas**. Esta camada conecta o mundo externo (usuários, clientes HTTP) com a lógica de negócio da aplicação.

## 📁 Estrutura

```
src/interface/http/
├── controllers/
│   ├── AuthController.js           # ✅ Autenticação
│   ├── ApostasController.js        # ✅ Apostas
│   └── EventosController.js        # ✅ Eventos
├── routes/
│   ├── auth.routes.js              # ✅ Rotas de autenticação
│   ├── apostas.routes.js           # ✅ Rotas de apostas
│   ├── eventos.routes.js           # ✅ Rotas de eventos
│   └── index.js                    # ✅ Agregador de rotas
└── middlewares/
    ├── authentication.js           # ✅ Verificação de autenticação
    ├── authorization.js            # ✅ RBAC (permissões)
    └── error-handler.js            # ✅ Tratamento de erros
```

---

## 🎯 Princípios da Interface Layer

### 1. **Controllers não contêm Lógica de Negócio**
Controllers apenas:
- Extraem dados do `req` (request)
- Chamam Use Cases
- Formatam resposta e retornam via `res` (response)

❌ **Errado:**
```javascript
async criar(req, res) {
    const usuario = await db.query('SELECT...');
    if (usuario.isSuperAdmin) { // Lógica de negócio aqui!
        throw new Error('Super Admin não pode apostar');
    }
}
```

✅ **Correto:**
```javascript
async criar(req, res, next) {
    try {
        const resultado = await this.criarApostaUseCase.executar({
            userId: req.userId,
            time: req.body.time,
            valor: req.body.valor
        });
        res.status(201).json(resultado);
    } catch (erro) {
        next(erro); // Delega para ErrorHandler
    }
}
```

### 2. **Middlewares são Composáveis**
Middlewares podem ser combinados:
```javascript
router.post('/', 
    authMiddleware.requireAuth(),       // 1º: Verifica autenticação
    authorizationMiddleware.canBet(),   // 2º: Verifica permissão
    (req, res, next) => {               // 3º: Controller
        controller.criar(req, res, next);
    }
);
```

### 3. **Error Handling Centralizado**
Todos os erros são tratados pelo `ErrorHandler`:
```javascript
class AuthController {
    async login(req, res, next) {
        try {
            const resultado = await this.fazerLoginUseCase.executar(...);
            res.json(resultado);
        } catch (erro) {
            next(erro); // ErrorHandler captura
        }
    }
}
```

### 4. **Dependency Injection**
Controllers recebem Use Cases via construtor:
```javascript
constructor(registrarUsuarioUseCase, fazerLoginUseCase, sessionManager) {
    this.registrarUsuarioUseCase = registrarUsuarioUseCase;
    this.fazerLoginUseCase = fazerLoginUseCase;
    this.sessionManager = sessionManager;
}
```

---

## 🔒 Middlewares

### AuthenticationMiddleware

**Responsabilidade:** Verificar se usuário está autenticado via sessão.

**Métodos:**
- `requireAuth()` - Requer autenticação (401 se não autenticado)
- `optionalAuth()` - Autenticação opcional (continua mesmo sem login)

**Exemplo de uso:**
```javascript
// Requer autenticação
router.get('/minhas', authMiddleware.requireAuth(), controller.minhas);

// Autenticação opcional (público)
router.get('/ativo', authMiddleware.optionalAuth(), controller.ativo);
```

**Comportamento:**
- Verifica `req.session.userId`
- Anexa `req.userId` ao request
- Retorna 401 se não autenticado (requireAuth)

---

### AuthorizationMiddleware

**Responsabilidade:** Verificar permissões do usuário (RBAC).

**Métodos:**
- `requireAdmin()` - Requer Admin ou Super Admin (403 se não autorizado)
- `requireSuperAdmin()` - Requer Super Admin (403 se não autorizado)
- `canBet()` - Verifica se pode apostar (Super Admin não pode)

**Exemplo de uso:**
```javascript
// Apenas Admin ou Super Admin
router.post('/eventos', 
    authMiddleware.requireAuth(),
    authorizationMiddleware.requireAdmin(),
    controller.criar
);

// Verifica se pode apostar
router.post('/apostas',
    authMiddleware.requireAuth(),
    authorizationMiddleware.canBet(),
    controller.criar
);
```

**Comportamento:**
- Busca usuário no banco via `usuarioRepository`
- Usa `ValidadorPermissoes` (Domain Service)
- Anexa `req.usuario` ao request
- Retorna 403 se não autorizado

---

### ErrorHandler

**Responsabilidade:** Tratamento centralizado de erros.

**Tipos de erro classificados:**
- **validation_error** (400) - Erros de validação (Domain)
- **permission_error** (403) - Erros de permissão
- **not_found_error** (404) - Recurso não encontrado
- **internal_error** (500) - Erro interno

**Exemplo de resposta:**
```json
{
  "sucesso": false,
  "erro": "Email já cadastrado",
  "tipo": "validation_error"
}
```

**Registrar no Express:**
```javascript
// Deve ser o ÚLTIMO middleware registrado
app.use(ErrorHandler.handle);
```

---

## 🎮 Controllers

### AuthController

**Responsabilidade:** Gerenciar autenticação.

**Rotas:**
- `POST /auth/registro` - Registrar novo usuário
- `POST /auth/login` - Autenticar usuário
- `POST /auth/logout` - Encerrar sessão
- `GET /auth/me` - Dados do usuário autenticado

**Dependências:**
- `registrarUsuarioUseCase`
- `fazerLoginUseCase`
- `fazerLogoutUseCase`
- `obterUsuarioAtualUseCase`
- `sessionManager`

**Exemplo:**
```javascript
async registro(req, res, next) {
    try {
        const { nome, email, senha } = req.body;
        const resultado = await this.registrarUsuarioUseCase.executar({ nome, email, senha });
        
        // Cria sessão automaticamente
        this.sessionManager.criarSessao(req, resultado.usuario.id, resultado.usuario);
        
        res.status(201).json(resultado);
    } catch (erro) {
        next(erro);
    }
}
```

---

### ApostasController

**Responsabilidade:** Gerenciar apostas.

**Rotas:**
- `POST /apostas` - Criar nova aposta
- `GET /apostas/minhas` - Listar apostas do usuário
- `GET /apostas/historico` - Histórico completo (paginado)
- `POST /apostas/simular` - Simular retorno estimado

**Dependências:**
- `criarApostaUseCase`
- `listarMinhasApostasUseCase`
- `calcularRetornoEstimadoUseCase`
- `obterHistoricoApostasUseCase`

**Exemplo:**
```javascript
async criar(req, res, next) {
    try {
        const { time, valor } = req.body;
        const resultado = await this.criarApostaUseCase.executar({
            userId: req.userId,
            time,
            valor
        });
        res.status(201).json(resultado);
    } catch (erro) {
        next(erro);
    }
}
```

---

### EventosController

**Responsabilidade:** Gerenciar eventos (Admin/Super Admin).

**Rotas:**
- `GET /eventos/ativo` - Buscar evento ativo (público)
- `POST /eventos` - Criar evento (Admin)
- `PATCH /eventos/ativo/apostas` - Abrir/fechar apostas (Admin)
- `POST /eventos/ativo/vencedor` - Definir vencedor (Admin)
- `POST /eventos/resetar` - Novo evento (Admin)

**Dependências:**
- `criarNovoEventoUseCase`
- `obterEventoAtivoUseCase`
- `abrirFecharApostasUseCase`
- `definirVencedorUseCase`
- `resetarEventoUseCase`

**Exemplo:**
```javascript
async definirVencedor(req, res, next) {
    try {
        const { timeVencedor } = req.body;
        const resultado = await this.definirVencedorUseCase.executar({
            userId: req.userId,
            timeVencedor
        });
        res.json(resultado);
    } catch (erro) {
        next(erro);
    }
}
```

---

## 🛣️ Routes

### auth.routes.js

**Rotas de Autenticação:**
```javascript
POST   /auth/registro    # Público
POST   /auth/login       # Público
POST   /auth/logout      # Autenticado
GET    /auth/me          # Autenticado
```

---

### apostas.routes.js

**Rotas de Apostas:**
```javascript
POST   /apostas                # Autenticado + Pode apostar
GET    /apostas/minhas         # Autenticado
GET    /apostas/historico      # Autenticado
POST   /apostas/simular        # Autenticado
```

---

### eventos.routes.js

**Rotas de Eventos:**
```javascript
GET    /eventos/ativo                 # Público
POST   /eventos                       # Admin
PATCH  /eventos/ativo/apostas         # Admin
POST   /eventos/ativo/vencedor        # Admin
POST   /eventos/resetar               # Admin
```

---

## 🔗 Integração com Use Cases

### Fluxo de uma Requisição

```
1. Request HTTP
   ↓
2. Middlewares (authentication, authorization)
   ↓
3. Controller (extrai dados, chama Use Case)
   ↓
4. Use Case (orquestra lógica)
   ↓
5. Domain Layer (regras de negócio)
   ↓
6. Infrastructure Layer (persistência)
   ↓
7. Controller (formata resposta)
   ↓
8. Response HTTP
```

### Exemplo Completo

**Request:**
```http
POST /apostas HTTP/1.1
Content-Type: application/json
Cookie: bolao.sid=abc123

{
  "time": "Time A",
  "valor": 50
}
```

**Fluxo:**
1. `authMiddleware.requireAuth()` → Verifica sessão
2. `authorizationMiddleware.canBet()` → Verifica se pode apostar
3. `ApostasController.criar()` → Extrai dados
4. `CriarApostaUseCase.executar()` → Orquestra
5. `ValidadorPermissoes.podeApostar()` → Valida (Domain)
6. `Aposta` → Cria entidade (Domain)
7. `SQLiteApostaRepository.criar()` → Persiste (Infrastructure)
8. Controller → Retorna resposta

**Response:**
```json
{
  "sucesso": true,
  "aposta": {
    "id": 1,
    "userId": 5,
    "time": "Time A",
    "valor": 50,
    "valorFormatado": "R$ 50,00"
  }
}
```

---

## 🧪 Testes (Futuro)

### Estratégia de Testes

**Testes de Controllers:**
- Mock dos Use Cases
- Testar extração de dados do request
- Testar formatação de resposta
- Testar tratamento de erros

**Testes de Middlewares:**
- Testar autenticação (sessão válida/inválida)
- Testar autorização (permissões)
- Testar error handler (classificação de erros)

**Testes de Integração (E2E):**
- Usar supertest
- Banco de dados em memória
- Testar fluxo completo (request → response)

---

## 📊 Diagrama de Dependências

```
Routes
  ↓ usam
Controllers
  ↓ usam
Use Cases (Application)
  ↓ usam
Domain Layer + Infrastructure Layer
```

---

## 🚀 Próximos Passos

### 1. Dependency Injection Container
**Criar:** `src/infrastructure/config/container.js`

**Responsabilidades:**
- Instanciar Database
- Instanciar Repositories
- Instanciar Security (BcryptHasher, SessionManager)
- Instanciar Use Cases
- Instanciar Middlewares
- Instanciar Controllers
- Fornecer via factory

**Exemplo:**
```javascript
class Container {
    constructor() {
        this._setupDatabase();
        this._setupRepositories();
        this._setupSecurity();
        this._setupUseCases();
        this._setupMiddlewares();
        this._setupControllers();
    }
    
    _setupControllers() {
        this.instances.authController = new AuthController(
            this.instances.registrarUsuario,
            this.instances.fazerLogin,
            this.instances.fazerLogout,
            this.instances.obterUsuarioAtual,
            this.instances.sessionManager
        );
    }
    
    get(name) {
        return this.instances[name];
    }
}
```

---

### 2. Novo Server.js
**Criar:** `src/interface/http/server.js`

**Objetivo:** Servidor Express limpo

```javascript
const express = require('express');
const container = require('../../infrastructure/config/container');
const routes = require('./routes');
const ErrorHandler = require('./middlewares/error-handler');

const app = express();

// Middlewares globais
app.use(express.json());
app.use(express.static('public'));
app.use(container.get('sessionManager').getMiddleware());

// Rotas
const { controllers, middlewares } = container.getAll();
const allRoutes = routes(controllers, middlewares);

app.use('/auth', allRoutes.auth);
app.use('/apostas', allRoutes.apostas);
app.use('/eventos', allRoutes.eventos);

// Error Handler (último middleware)
app.use(ErrorHandler.handle);

app.listen(3000, () => {
    console.log('🚀 Servidor rodando na porta 3000');
});
```

---

## 📚 Referências

- [Express.js Documentation](https://expressjs.com/)
- [Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Middleware Pattern](https://expressjs.com/en/guide/using-middleware.html)

---

**Última Atualização:** 2026-01-19  
**Status:** Interface Layer Implementada ✅  
**Próxima Fase:** Dependency Injection Container
