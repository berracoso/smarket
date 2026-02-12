// src/infrastructure/config/container.js

// 1. Database & Config
const database = require('../database/postgres');
const BcryptHasher = require('../security/BcryptHasher');
const SessionManager = require('../security/SessionManager');

// 2. Repositories
const PostgresUsuarioRepository = require('../repositories/PostgresUsuarioRepository');
const PostgresEventoRepository = require('../repositories/PostgresEventoRepository');
const PostgresApostaRepository = require('../repositories/PostgresApostaRepository');

// 3. Middlewares (Classes)
const AuthenticationMiddleware = require('../../interface/http/middlewares/authentication');
const AuthorizationMiddleware = require('../../interface/http/middlewares/authorization');

// 4. Use Cases
const RegistrarUsuario = require('../../application/use-cases/autenticacao/RegistrarUsuario');
const FazerLogin = require('../../application/use-cases/autenticacao/FazerLogin');
const ObterEventoAtivo = require('../../application/use-cases/eventos/ObterEventoAtivo');
const CriarNovoEvento = require('../../application/use-cases/eventos/CriarNovoEvento');
const AbrirFecharApostas = require('../../application/use-cases/eventos/AbrirFecharApostas');
const DefinirVencedor = require('../../application/use-cases/eventos/DefinirVencedor');
const CriarAposta = require('../../application/use-cases/apostas/CriarAposta');
const ListarMinhasApostas = require('../../application/use-cases/apostas/ListarMinhasApostas');

// 5. Controllers (IMPORTANTE: Faltava isso no seu original)
const AuthController = require('../../interface/http/controllers/AuthController');
const EventosController = require('../../interface/http/controllers/EventosController');
const ApostasController = require('../../interface/http/controllers/ApostasController');
const UsersController = require('../../interface/http/controllers/UsersController');

// --- INSTANCIAÇÃO ---

// Infra
const hasher = new BcryptHasher();
const sessionManager = new SessionManager(); 

// Repositories
const usuarioRepository = new PostgresUsuarioRepository(database);
const eventoRepository = new PostgresEventoRepository(database);
const apostaRepository = new PostgresApostaRepository(database);

// Middlewares
// (Atenção: Passamos o sessionManager ou repositório se necessário)
const authenticationMiddleware = new AuthenticationMiddleware(usuarioRepository);
const authorizationMiddleware = new AuthorizationMiddleware(usuarioRepository);

// Use Cases
const registrarUsuario = new RegistrarUsuario(usuarioRepository, hasher);
const fazerLogin = new FazerLogin(usuarioRepository, hasher);
const obterEventoAtivo = new ObterEventoAtivo(eventoRepository, apostaRepository);
const criarNovoEvento = new CriarNovoEvento(eventoRepository);
const abrirFecharApostas = new AbrirFecharApostas(eventoRepository);
const definirVencedor = new DefinirVencedor(eventoRepository, apostaRepository, usuarioRepository);
const criarAposta = new CriarAposta(apostaRepository, eventoRepository, usuarioRepository);
const listarMinhasApostas = new ListarMinhasApostas(apostaRepository);

// Controllers
const authController = new AuthController(fazerLogin, registrarUsuario);
const eventosController = new EventosController(obterEventoAtivo, criarNovoEvento, abrirFecharApostas, definirVencedor);
const apostasController = new ApostasController(criarAposta, listarMinhasApostas);
// UsersController geralmente precisa apenas do repositório ou de casos de uso de listagem
const usersController = new UsersController(usuarioRepository); 

module.exports = {
  // Infra
  database,
  hasher,

  // Middlewares
  authenticationMiddleware,
  authorizationMiddleware,

  // Controllers (As rotas usam ISSO)
  authController,
  eventosController,
  apostasController,
  usersController
};