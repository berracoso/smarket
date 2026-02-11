const { Router } = require('express');
const AuthController = require('../controllers/AuthController');

// Importando as dependências do container
const { 
  registrarUsuario, 
  fazerLogin,
  sessionManager 
} = require('../../../infrastructure/config/container');

const router = Router();

// Injetando as dependências na ordem correta
const authController = new AuthController(registrarUsuario, fazerLogin, sessionManager);

router.post('/registro', (req, res, next) => authController.registro(req, res, next));
router.post('/login', (req, res, next) => authController.login(req, res, next));

// Rota auxiliar /me
const authentication = require('../middlewares/authentication');
router.get('/me', authentication, (req, res, next) => authController.me(req, res, next));

module.exports = router;