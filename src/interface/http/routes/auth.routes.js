const { Router } = require('express');
const AuthController = require('../controllers/AuthController');

// Importando as dependências do container de injeção
const { 
  registrarUsuario, 
  fazerLogin,
  sessionManager // <--- Certifique-se de importar isso
} = require('../../../infrastructure/config/container');

const router = Router();

// Injetando as dependências no Controller
// Ordem importa: (RegistrarUsuario, FazerLogin, SessionManager)
const authController = new AuthController(registrarUsuario, fazerLogin, sessionManager);

// Definindo as rotas e vinculando ao controller
// Usamos arrow function ou .bind(authController) para manter o contexto do 'this'
router.post('/registro', (req, res, next) => authController.registro(req, res, next));
router.post('/login', (req, res, next) => authController.login(req, res, next));

// Rota auxiliar para verificar token (opcional, se tiver endpoint /me)
const authentication = require('../middlewares/authentication');
router.get('/me', authentication, (req, res, next) => authController.me(req, res, next));

module.exports = router;