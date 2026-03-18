// src/infrastructure/config/container.js

// 1. Database & Config
const getDbConnection = require('../database/sqlite'); // <-- Alterado aqui
const BcryptHasher = require('../security/BcryptHasher');
const SessionManager = require('../security/SessionManager');

// 2. Repositories (SQLite) <-- Alterado aqui
const SQLiteUsuarioRepository = require('../repositories/SQLiteUsuarioRepository');
const SQLiteEventoRepository = require('../repositories/SQLiteEventoRepository');
const SQLiteApostaRepository = require('../repositories/SQLiteApostaRepository');

// 3. Middlewares
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

// 5. Controllers
const AuthController = require('../../interface/http/controllers/AuthController');
const EventosController = require('../../interface/http/controllers/EventosController');
const ApostasController = require('../../interface/http/controllers/ApostasController');
const UsersController = require('../../interface/http/controllers/UsersController');

// --- INSTANCIAÇÃO ---
const hasher = new BcryptHasher();
const sessionManager = new SessionManager(); 

// Repositories (Passamos a função getDbConnection) <-- Alterado aqui
const usuarioRepository = new SQLiteUsuarioRepository(getDbConnection);
const eventoRepository = new SQLiteEventoRepository(getDbConnection);
const apostaRepository = new SQLiteApostaRepository(getDbConnection);

// Middlewares
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
const usersController = new UsersController(usuarioRepository); 

module.exports = {
  getDbConnection, // Opcional expor
  hasher,
  authenticationMiddleware,
  authorizationMiddleware,
  authController,
  eventosController,
  apostasController,
  usersController
};