const express = require('express');
const router = express.Router();
const container = require('../../../infrastructure/config/container');

// Extrai as instâncias prontas do container
const { authController, authenticationMiddleware } = container;

// Rotas Públicas
router.post('/register', (req, res, next) => authController.register(req, res, next));
router.post('/login', (req, res, next) => authController.login(req, res, next));
router.post('/logout', (req, res, next) => authController.logout(req, res, next));

// Rotas Privadas (Usa o .requireAuth do middleware)
router.get('/me', authenticationMiddleware.requireAuth, (req, res, next) => authController.me(req, res, next));

module.exports = router;