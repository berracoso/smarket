// Repositories
const PostgresUsuarioRepository = require('../repositories/PostgresUsuarioRepository');
const PostgresEventoRepository = require('../repositories/PostgresEventoRepository');
const PostgresApostaRepository = require('../repositories/PostgresApostaRepository');

// Security / Services
const BcryptHasher = require('../security/BcryptHasher');
const SessionManager = require('../security/SessionManager');

// Use Cases
const RegistrarUsuario = require('../../application/use-cases/autenticacao/RegistrarUsuario');
const FazerLogin = require('../../application/use-cases/autenticacao/FazerLogin');
// Mantenha outros use cases que você tiver aqui...

// Instanciação das dependências

// 1. Infraestrutura
const hasher = new BcryptHasher();
const sessionManager = new SessionManager(); 

// 2. Repositórios
const usuarioRepository = new PostgresUsuarioRepository();
const eventoRepository = new PostgresEventoRepository();
const apostaRepository = new PostgresApostaRepository();

// 3. Casos de Uso
const registrarUsuario = new RegistrarUsuario(usuarioRepository, hasher);
const fazerLogin = new FazerLogin(usuarioRepository, hasher);

module.exports = {
  // Infra
  hasher,
  sessionManager, 

  // Repos
  usuarioRepository,
  eventoRepository,
  apostaRepository,

  // Use Cases
  registrarUsuario,
  fazerLogin,
};