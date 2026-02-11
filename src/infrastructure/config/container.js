/**
 * Container de Injeção de Dependência (Versão PostgreSQL Corrigida)
 */

// 1. Database
const db = require('../database/postgres');

// 2. Repositories
const UsuarioRepository = require('../repositories/PostgresUsuarioRepository');
const EventoRepository = require('../repositories/PostgresEventoRepository');
const ApostaRepository = require('../repositories/PostgresApostaRepository');

// 3. Security
const BcryptHasher = require('../security/BcryptHasher');
const SessionManager = require('../security/SessionManager');

// 4. Use Cases
const RegistrarUsuario = require('../../application/use-cases/autenticacao/RegistrarUsuario');
const FazerLogin = require('../../application/use-cases/autenticacao/FazerLogin');
const FazerLogout = require('../../application/use-cases/autenticacao/FazerLogout');
const ObterUsuarioAtual = require('../../application/use-cases/autenticacao/ObterUsuarioAtual');

const CriarAposta = require('../../application/use-cases/apostas/CriarAposta');
const ListarMinhasApostas = require('../../application/use-cases/apostas/ListarMinhasApostas');
const CalcularRetornoEstimado = require('../../application/use-cases/apostas/CalcularRetornoEstimado');
const ObterHistoricoApostas = require('../../application/use-cases/apostas/ObterHistoricoApostas');

const ListarUsuarios = require('../../application/use-cases/usuarios/ListarUsuarios');
const PromoverUsuario = require('../../application/use-cases/usuarios/PromoverUsuario');
const RebaixarUsuario = require('../../application/use-cases/usuarios/RebaixarUsuario');

const CriarNovoEvento = require('../../application/use-cases/eventos/CriarNovoEvento');
const ObterEventoAtivo = require('../../application/use-cases/eventos/ObterEventoAtivo');
const AbrirFecharApostas = require('../../application/use-cases/eventos/AbrirFecharApostas');
const DefinirVencedor = require('../../application/use-cases/eventos/DefinirVencedor');
const ResetarEvento = require('../../application/use-cases/eventos/ResetarEvento');

// 5. Interface (Controllers & Middlewares)
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

class Container {
    constructor() {
        this.instances = {};
        this._initialize();
    }

    _initialize() {
        // Setup Database
        this.instances.db = db;

        // Setup Repositories
        this.instances.usuarioRepository = new UsuarioRepository(db);
        this.instances.eventoRepository = new EventoRepository(db);
        this.instances.apostaRepository = new ApostaRepository(db);

        // Setup Security
        this.instances.bcryptHasher = new BcryptHasher();
        this.instances.sessionManager = new SessionManager();

        // Setup Use Cases
        this._setupUseCases();

        // Setup Middlewares & Controllers
        this._setupInterface();
    }

    _setupUseCases() {
        this.instances.registrarUsuario = new RegistrarUsuario(this.instances.usuarioRepository, this.instances.bcryptHasher);
        this.instances.fazerLogin = new FazerLogin(this.instances.usuarioRepository, this.instances.bcryptHasher, this.instances.sessionManager);
        this.instances.fazerLogout = new FazerLogout(this.instances.sessionManager);
        this.instances.obterUsuarioAtual = new ObterUsuarioAtual(this.instances.usuarioRepository);

        this.instances.listarUsuarios = new ListarUsuarios(this.instances.usuarioRepository);
        this.instances.promoverUsuario = new PromoverUsuario(this.instances.usuarioRepository);
        this.instances.rebaixarUsuario = new RebaixarUsuario(this.instances.usuarioRepository);

        this.instances.criarAposta = new CriarAposta(this.instances.apostaRepository, this.instances.eventoRepository);
        this.instances.listarMinhasApostas = new ListarMinhasApostas(this.instances.apostaRepository);
        this.instances.calcularRetornoEstimado = new CalcularRetornoEstimado(this.instances.apostaRepository, this.instances.eventoRepository);
        this.instances.obterHistoricoApostas = new ObterHistoricoApostas(this.instances.apostaRepository);

        this.instances.criarNovoEvento = new CriarNovoEvento(this.instances.eventoRepository);
        this.instances.obterEventoAtivo = new ObterEventoAtivo(this.instances.eventoRepository);
        this.instances.abrirFecharApostas = new AbrirFecharApostas(this.instances.eventoRepository);
        this.instances.definirVencedor = new DefinirVencedor(this.instances.eventoRepository, this.instances.apostaRepository);
        this.instances.resetarEvento = new ResetarEvento(this.instances.eventoRepository, this.instances.apostaRepository);
    }

    _setupInterface() {
        // Middlewares
        this.instances.authMiddleware = new AuthenticationMiddleware(this.instances.sessionManager);
        this.instances.authzMiddleware = new AuthorizationMiddleware(this.instances.usuarioRepository);
        
        // Controllers
        this.instances.authController = new AuthController(
            this.instances.registrarUsuario,
            this.instances.fazerLogin,
            this.instances.fazerLogout,
            this.instances.obterUsuarioAtual
        );

        this.instances.usersController = new UsersController(
            this.instances.listarUsuarios,
            this.instances.promoverUsuario,
            this.instances.rebaixarUsuario
        );

        this.instances.apostasController = new ApostasController(
            this.instances.criarAposta,
            this.instances.listarMinhasApostas,
            this.instances.obterHistoricoApostas,
            this.instances.calcularRetornoEstimado
        );

        this.instances.eventosController = new EventosController(
            this.instances.criarNovoEvento,
            this.instances.obterEventoAtivo,
            this.instances.definirVencedor,
            this.instances.abrirFecharApostas,
            this.instances.resetarEvento
        );

        // Routes
        this.instances.authRoutes = createAuthRoutes(
            this.instances.authController,
            this.instances.authMiddleware
        );

        // CORREÇÃO AQUI: Passando authzMiddleware (que tem o requireAdmin)
        this.instances.usersRoutes = createUsersRoutes(
            this.instances.usersController,
            this.instances.authzMiddleware 
        );

        this.instances.apostasRoutes = createApostasRoutes(
            this.instances.apostasController,
            this.instances.authMiddleware
        );

        this.instances.eventosRoutes = createEventosRoutes(
            this.instances.eventosController,
            this.instances.authMiddleware
        );
        
        const createLegacyRoutes = require('../../interface/http/routes/legacy.routes');
        this.instances.legacyRoutes = createLegacyRoutes(
            this.instances.eventosController,
            this.instances.authMiddleware
        );
    }

    get(name) {
        if (!this.instances[name]) throw new Error(`Dependência não encontrada: ${name}`);
        return this.instances[name];
    }
}

module.exports = new Container();