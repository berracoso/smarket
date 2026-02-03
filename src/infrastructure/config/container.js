/**
 * Dependency Injection Container
 * 
 * Responsável por instanciar e gerenciar todas as dependências da aplicação
 * seguindo os princípios de Clean Architecture.
 * 
 * Ordem de instanciação:
 * 1. Database (SQLite Connection)
 * 2. Repositories (Infrastructure Layer)
 * 3. Security (Hasher + SessionManager)
 * 4. Use Cases (Application Layer)
 * 5. Middlewares (Interface Layer)
 * 6. Controllers (Interface Layer)
 * 7. Routes (Interface Layer)
 */

// ========================================
// IMPORTS - Infrastructure Layer
// ========================================
const sqliteConnection = require('../database/sqlite');
const SQLiteUsuarioRepository = require('../repositories/SQLiteUsuarioRepository');
const SQLiteEventoRepository = require('../repositories/SQLiteEventoRepository');
const SQLiteApostaRepository = require('../repositories/SQLiteApostaRepository');
const BcryptHasher = require('../security/BcryptHasher');
const SessionManager = require('../security/SessionManager');

// ========================================
// IMPORTS - Application Layer (Use Cases)
// ========================================
// Autenticação
const RegistrarUsuario = require('../../application/use-cases/autenticacao/RegistrarUsuario');
const FazerLogin = require('../../application/use-cases/autenticacao/FazerLogin');
const FazerLogout = require('../../application/use-cases/autenticacao/FazerLogout');
const ObterUsuarioAtual = require('../../application/use-cases/autenticacao/ObterUsuarioAtual');

// Apostas
const CriarAposta = require('../../application/use-cases/apostas/CriarAposta');
const ListarMinhasApostas = require('../../application/use-cases/apostas/ListarMinhasApostas');
const CalcularRetornoEstimado = require('../../application/use-cases/apostas/CalcularRetornoEstimado');
const ObterHistoricoApostas = require('../../application/use-cases/apostas/ObterHistoricoApostas');

// Usuários
const ListarUsuarios = require('../../application/use-cases/usuarios/ListarUsuarios');
const PromoverUsuario = require('../../application/use-cases/usuarios/PromoverUsuario');
const RebaixarUsuario = require('../../application/use-cases/usuarios/RebaixarUsuario');

// Eventos
const CriarNovoEvento = require('../../application/use-cases/eventos/CriarNovoEvento');
const ObterEventoAtivo = require('../../application/use-cases/eventos/ObterEventoAtivo');
const AbrirFecharApostas = require('../../application/use-cases/eventos/AbrirFecharApostas');
const DefinirVencedor = require('../../application/use-cases/eventos/DefinirVencedor');
const ResetarEvento = require('../../application/use-cases/eventos/ResetarEvento');

// ========================================
// IMPORTS - Interface Layer
// ========================================
const AuthController = require('../../interface/http/controllers/AuthController');
const UsersController = require('../../interface/http/controllers/UsersController');
const ApostasController = require('../../interface/http/controllers/ApostasController');
const EventosController = require('../../interface/http/controllers/EventosController');

const AuthenticationMiddleware = require('../../interface/http/middlewares/authentication');
const AuthorizationMiddleware = require('../../interface/http/middlewares/authorization');
const errorHandler = require('../../interface/http/middlewares/error-handler');

const createAuthRoutes = require('../../interface/http/routes/auth.routes');
const createUsersRoutes = require('../../interface/http/routes/users.routes');
const createApostasRoutes = require('../../interface/http/routes/apostas.routes');
const createEventosRoutes = require('../../interface/http/routes/eventos.routes');

/**
 * Container de Injeção de Dependências
 * 
 * Implementa o padrão Singleton para garantir única instância
 * de todas as dependências durante o ciclo de vida da aplicação.
 */
class Container {
    constructor() {
        this.instances = {};
        this._initialize();
    }

    /**
     * Inicializa todas as dependências na ordem correta
     */
    _initialize() {
        this._setupDatabase();
        this._setupRepositories();
        this._setupSecurity();
        this._setupUseCases();
        this._setupMiddlewares();
        this._setupControllers();
        this._setupRoutes();
    }

    /**
     * 1. Setup Database Connection (Singleton)
     */
    _setupDatabase() {
        // Manter referência ao SQLiteConnection (não apenas ao db)
        this.instances.sqliteConnection = sqliteConnection;
        this.instances.db = sqliteConnection.getConnection();
    }

    /**
     * 2. Setup Repositories (Infrastructure Layer)
     * 
     * Instancia os repositórios concretos que implementam
     * as interfaces definidas no Domain Layer.
     */
    _setupRepositories() {
        // Passar SQLiteConnection (que tem métodos wrapper com Promise)
        this.instances.usuarioRepository = new SQLiteUsuarioRepository(this.instances.sqliteConnection);
        this.instances.eventoRepository = new SQLiteEventoRepository(this.instances.sqliteConnection);
        this.instances.apostaRepository = new SQLiteApostaRepository(this.instances.sqliteConnection);
    }

    /**
     * 3. Setup Security Services
     * 
     * Instancia serviços de segurança (hash de senhas, sessões).
     */
    _setupSecurity() {
        this.instances.bcryptHasher = new BcryptHasher();
        this.instances.sessionManager = new SessionManager();
    }

    /**
     * 4. Setup Use Cases (Application Layer)
     * 
     * Instancia todos os casos de uso injetando suas dependências.
     * Use Cases orquestram a lógica de negócio sem contê-la.
     */
    _setupUseCases() {
        // ========================================
        // Use Cases de Autenticação
        // ========================================
        this.instances.registrarUsuario = new RegistrarUsuario(
            this.instances.usuarioRepository,
            this.instances.bcryptHasher
        );

        this.instances.fazerLogin = new FazerLogin(
            this.instances.usuarioRepository,
            this.instances.bcryptHasher
        );

        this.instances.fazerLogout = new FazerLogout(
            this.instances.sessionManager
        );

        this.instances.obterUsuarioAtual = new ObterUsuarioAtual(
            this.instances.usuarioRepository
        );

        // ========================================
        // Use Cases de Usuários
        // ========================================
        this.instances.listarUsuarios = new ListarUsuarios(
            this.instances.usuarioRepository
        );

        this.instances.promoverUsuario = new PromoverUsuario(
            this.instances.usuarioRepository
        );

        this.instances.rebaixarUsuario = new RebaixarUsuario(
            this.instances.usuarioRepository
        );

        // ========================================
        // Use Cases de Apostas
        // ========================================
        this.instances.criarAposta = new CriarAposta(
            this.instances.apostaRepository,
            this.instances.eventoRepository,
            this.instances.usuarioRepository
        );

        this.instances.listarMinhasApostas = new ListarMinhasApostas(
            this.instances.apostaRepository,
            this.instances.eventoRepository
        );

        this.instances.calcularRetornoEstimado = new CalcularRetornoEstimado(
            this.instances.apostaRepository,
            this.instances.eventoRepository
        );

        this.instances.obterHistoricoApostas = new ObterHistoricoApostas(
            this.instances.apostaRepository,
            this.instances.eventoRepository
        );

        // ========================================
        // Use Cases de Eventos
        // ========================================
        this.instances.criarNovoEvento = new CriarNovoEvento(
            this.instances.eventoRepository,
            this.instances.usuarioRepository
        );

        this.instances.obterEventoAtivo = new ObterEventoAtivo(
            this.instances.eventoRepository,
            this.instances.apostaRepository
        );

        this.instances.abrirFecharApostas = new AbrirFecharApostas(
            this.instances.eventoRepository,
            this.instances.usuarioRepository
        );

        this.instances.definirVencedor = new DefinirVencedor(
            this.instances.eventoRepository,
            this.instances.apostaRepository,
            this.instances.usuarioRepository
        );

        this.instances.resetarEvento = new ResetarEvento(
            this.instances.eventoRepository,
            this.instances.usuarioRepository
        );
    }

    /**
     * 5. Setup Middlewares (Interface Layer)
     * 
     * Configura middlewares com suas dependências.
     */
    _setupMiddlewares() {
        // Instanciar AuthenticationMiddleware
        this.instances.authMiddleware = new AuthenticationMiddleware(this.instances.sessionManager);

        // Instanciar AuthorizationMiddleware
        this.instances.authzMiddleware = new AuthorizationMiddleware(this.instances.usuarioRepository);

        // Error Handler Middleware (método estático handle)
        this.instances.errorHandler = errorHandler.handle.bind(errorHandler);

        // Atalhos para os middlewares individuais
        this.instances.requireAuth = this.instances.authMiddleware.requireAuth();
        this.instances.optionalAuth = this.instances.authMiddleware.optionalAuth();
        this.instances.requireAdmin = this.instances.authzMiddleware.requireAdmin();
        this.instances.requireSuperAdmin = this.instances.authzMiddleware.requireSuperAdmin();
        this.instances.canBet = this.instances.authzMiddleware.canBet();
    }

    /**
     * 6. Setup Controllers (Interface Layer)
     * 
     * Instancia controllers injetando os Use Cases necessários.
     */
    _setupControllers() {
        // AuthController
        this.instances.authController = new AuthController(
            this.instances.registrarUsuario,
            this.instances.fazerLogin,
            this.instances.fazerLogout,
            this.instances.obterUsuarioAtual,
            this.instances.sessionManager
        );

        // UsersController
        this.instances.usersController = new UsersController(
            this.instances.listarUsuarios,
            this.instances.promoverUsuario,
            this.instances.rebaixarUsuario
        );

        // ApostasController
        this.instances.apostasController = new ApostasController(
            this.instances.criarAposta,
            this.instances.listarMinhasApostas,
            this.instances.calcularRetornoEstimado,
            this.instances.obterHistoricoApostas
        );

        // EventosController
        this.instances.eventosController = new EventosController(
            this.instances.criarNovoEvento,
            this.instances.obterEventoAtivo,
            this.instances.abrirFecharApostas,
            this.instances.definirVencedor,
            this.instances.resetarEvento
        );
    }

    /**
     * 7. Setup Routes (Interface Layer)
     * 
     * Cria as rotas passando controllers e middlewares.
     */
    _setupRoutes() {
        // Criar rotas com dependências injetadas
        this.instances.authRoutes = createAuthRoutes(
            this.instances.authController,
            this.instances.authMiddleware
        );

        this.instances.usersRoutes = createUsersRoutes(
            this.instances.usersController,
            this.instances.authMiddleware,
            this.instances.authzMiddleware
        );

        this.instances.apostasRoutes = createApostasRoutes(
            this.instances.apostasController,
            this.instances.authMiddleware,
            this.instances.authzMiddleware
        );

        this.instances.eventosRoutes = createEventosRoutes(
            this.instances.eventosController,
            this.instances.authMiddleware,
            this.instances.authzMiddleware
        );

        // Rotas de compatibilidade (legacy)
        const createLegacyRoutes = require('../../interface/http/routes/legacy.routes');
        this.instances.legacyRoutes = createLegacyRoutes(
            this.instances.apostasController,
            this.instances.eventosController,
            this.instances.authMiddleware
        );
    }

    /**
     * Retorna uma instância específica pelo nome
     * 
     * @param {string} name - Nome da instância
     * @returns {*} Instância solicitada
     * @throws {Error} Se instância não existir
     */
    get(name) {
        if (!this.instances[name]) {
            throw new Error(`Dependência "${name}" não encontrada no container`);
        }
        return this.instances[name];
    }

    /**
     * Retorna todas as instâncias
     * 
     * @returns {Object} Objeto com todas as instâncias
     */
    getAll() {
        return { ...this.instances };
    }

    /**
     * Verifica se uma instância existe
     * 
     * @param {string} name - Nome da instância
     * @returns {boolean} True se existe
     */
    has(name) {
        return !!this.instances[name];
    }

    /**
     * Retorna lista de nomes de todas as dependências registradas
     * 
     * @returns {string[]} Array com nomes das dependências
     */
    list() {
        return Object.keys(this.instances);
    }
}

// Exporta instância única (Singleton)
module.exports = new Container();
