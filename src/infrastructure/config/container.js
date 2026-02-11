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
// ... outros use cases

// Instanciação das dependências (Singleton)

// 1. Infraestrutura Básica
const hasher = new BcryptHasher();
const sessionManager = new SessionManager(); // <--- Instância do Gerenciador de Sessão

// 2. Repositórios
const usuarioRepository = new PostgresUsuarioRepository();
const eventoRepository = new PostgresEventoRepository();
const apostaRepository = new PostgresApostaRepository();

// 3. Casos de Uso
const registrarUsuario = new RegistrarUsuario(usuarioRepository, hasher);
const fazerLogin = new FazerLogin(usuarioRepository, hasher);

// Exportar tudo o que é necessário nos Controllers/Rotas
module.exports = {
  // Infra
  hasher,
  sessionManager, // <--- EXPORTAÇÃO CRÍTICA

  // Repos
  usuarioRepository,
  eventoRepository,
  apostaRepository,

  // Use Cases
  registrarUsuario,
  fazerLogin,
  // ... adicione outros casos de uso conforme necessário
};