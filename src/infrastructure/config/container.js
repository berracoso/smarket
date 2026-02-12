// src/infrastructure/config/container.js

// Repositories
const PostgresUsuarioRepository = require('../repositories/PostgresUsuarioRepository');
const PostgresEventoRepository = require('../repositories/PostgresEventoRepository');
const PostgresApostaRepository = require('../repositories/PostgresApostaRepository');

// Database (IMPORTANTE: Importar a conexão com o banco)
const database = require('../database/postgres');

// Security / Services
const BcryptHasher = require('../security/BcryptHasher');
const SessionManager = require('../security/SessionManager');

// Middlewares
const AuthenticationMiddleware = require('../../interface/http/middlewares/authentication');
const AuthorizationMiddleware = require('../../interface/http/middlewares/authorization');

// Use Cases - Autenticação
const RegistrarUsuario = require('../../application/use-cases/autenticacao/RegistrarUsuario');
const FazerLogin = require('../../application/use-cases/autenticacao/FazerLogin');

// Use Cases - Eventos
const ObterEventoAtivo = require('../../application/use-cases/eventos/ObterEventoAtivo');
const CriarNovoEvento = require('../../application/use-cases/eventos/CriarNovoEvento');
const AbrirFecharApostas = require('../../application/use-cases/eventos/AbrirFecharApostas');
const DefinirVencedor = require('../../application/use-cases/eventos/DefinirVencedor');
const ResetarEvento = require('../../application/use-cases/eventos/ResetarEvento');

// Use Cases - Apostas
const CriarAposta = require('../../application/use-cases/apostas/CriarAposta');
const ListarMinhasApostas = require('../../application/use-cases/apostas/ListarMinhasApostas');
const ObterHistoricoApostas = require('../../application/use-cases/apostas/ObterHistoricoApostas');
const CalcularRetornoEstimado = require('../../application/use-cases/apostas/CalcularRetornoEstimado');

// --- INSTANCIAÇÃO (Singleton) ---

// 1. Infraestrutura
const hasher = new BcryptHasher();
const sessionManager = new SessionManager(); 

// 2. Repositórios (CORREÇÃO: Injetando o banco de dados)
const usuarioRepository = new PostgresUsuarioRepository(database);
const eventoRepository = new PostgresEventoRepository(database);
const apostaRepository = new PostgresApostaRepository(database);

// 3. Middlewares
const authenticationMiddleware = new AuthenticationMiddleware(sessionManager);
const authorizationMiddleware = new AuthorizationMiddleware(usuarioRepository);

// 4. Casos de Uso

// Auth
const registrarUsuario = new RegistrarUsuario(usuarioRepository, hasher);
const fazerLogin = new FazerLogin(usuarioRepository, hasher);

// Eventos
const obterEventoAtivo = new ObterEventoAtivo(eventoRepository, apostaRepository);
const criarNovoEvento = new CriarNovoEvento(eventoRepository);
const abrirFecharApostas = new AbrirFecharApostas(eventoRepository);
const definirVencedor = new DefinirVencedor(eventoRepository, apostaRepository, usuarioRepository);
const resetarEvento = new ResetarEvento(eventoRepository);

// Apostas
const criarAposta = new CriarAposta(apostaRepository, eventoRepository, usuarioRepository);
const listarMinhasApostas = new ListarMinhasApostas(apostaRepository);
const obterHistoricoApostas = new ObterHistoricoApostas(apostaRepository);
const calcularRetornoEstimado = new CalcularRetornoEstimado(eventoRepository);

module.exports = {
  // Infra
  hasher,
  sessionManager, 
  database, // Exportando banco caso precise em testes

  // Middlewares
  authenticationMiddleware,
  authorizationMiddleware,

  // Repos
  usuarioRepository,
  eventoRepository,
  apostaRepository,

  // Use Cases
  registrarUsuario,
  fazerLogin,
  
  obterEventoAtivo,
  criarNovoEvento,
  abrirFecharApostas,
  definirVencedor,
  resetarEvento,

  criarAposta,
  listarMinhasApostas,
  obterHistoricoApostas,
  calcularRetornoEstimado
};