// src/infrastructure/config/container.js

// 1. Database & Config
const getDbConnection = require('../database/sqlite'); 
const BcryptHasher = require('../security/BcryptHasher');
const SessionManager = require('../security/SessionManager');

// 2. Repositories (SQLite)
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
const ResetarEvento = require('../../application/use-cases/eventos/ResetarEvento');
const CriarAposta = require('../../application/use-cases/apostas/CriarAposta');
const ListarMinhasApostas = require('../../application/use-cases/apostas/ListarMinhasApostas');

// 5. Controllers
const AuthController = require('../../interface/http/controllers/AuthController');
const EventosController = require('../../interface/http/controllers/EventosController');
const ApostasController = require('../../interface/http/controllers/ApostasController');
const UsersController = require('../../interface/http/controllers/UsersController');

// --- INSTANCIAÇÃO DAS DEPENDÊNCIAS ---
const hasher = new BcryptHasher();
const sessionManager = new SessionManager(); 

// Repositories
const usuarioRepository = new SQLiteUsuarioRepository(getDbConnection);
const eventoRepository = new SQLiteEventoRepository(getDbConnection);
const apostaRepository = new SQLiteApostaRepository(getDbConnection);

// Middlewares
const authenticationMiddleware = new AuthenticationMiddleware(usuarioRepository);
const authorizationMiddleware = new AuthorizationMiddleware(usuarioRepository);

// --- INSTANCIAÇÃO DOS USE CASES (CORRIGIDA) ---
const registrarUsuario = new RegistrarUsuario(usuarioRepository, hasher);
const fazerLogin = new FazerLogin(usuarioRepository, hasher);
const obterEventoAtivo = new ObterEventoAtivo(eventoRepository, apostaRepository);

// ATENÇÃO: Se o CriarNovoEvento também validar usuário, ele precisa receber o usuarioRepository.
// Pela estrutura padrão, passaremos apenas o evento (ajuste se seu Use Case pedir 2 parametros).
const criarNovoEvento = new CriarNovoEvento(eventoRepository);

// 🛡️ CORREÇÕES CRÍTICAS DE INJEÇÃO ABAIXO 🛡️
// Antes: new AbrirFecharApostas(eventoRepository)
const abrirFecharApostas = new AbrirFecharApostas(eventoRepository, usuarioRepository);

// Antes: new ResetarEvento(eventoRepository)
const resetarEvento = new ResetarEvento(eventoRepository, usuarioRepository);
// ------------------------------------------------

const definirVencedor = new DefinirVencedor(eventoRepository, apostaRepository, usuarioRepository);
const criarAposta = new CriarAposta(apostaRepository, eventoRepository, usuarioRepository);
const listarMinhasApostas = new ListarMinhasApostas(apostaRepository);

// --- INSTANCIAÇÃO DOS CONTROLLERS ---
const authController = new AuthController(fazerLogin, registrarUsuario);

const eventosController = new EventosController(
  criarNovoEvento,
  obterEventoAtivo,
  abrirFecharApostas,
  definirVencedor,
  resetarEvento
);

const apostasController = new ApostasController(criarAposta, listarMinhasApostas);
const usersController = new UsersController(usuarioRepository); 

module.exports = {
  getDbConnection, 
  hasher,
  authenticationMiddleware,
  authorizationMiddleware,
  authController,
  eventosController,
  apostasController,
  usersController
};