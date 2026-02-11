const { Router } = require('express');
const AuthController = require('../controllers/AuthController');

// Importando dependências do container
const { 
  registrarUsuario, 
  fazerLogin,
  sessionManager,
  authenticationMiddleware 
} = require('../../../infrastructure/config/container');

const router = Router();
const authController = new AuthController(registrarUsuario, fazerLogin, sessionManager);

router.post('/registro', (req, res, next) => authController.registro(req, res, next));
router.post('/login', (req, res, next) => authController.login(req, res, next));

// Usa o método .requireAuth() do middleware instanciado
router.get('/me', authenticationMiddleware.requireAuth(), (req, res, next) => authController.me(req, res, next));

module.exports = router;