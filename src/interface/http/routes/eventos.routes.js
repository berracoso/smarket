const express = require('express');
const router = express.Router();
const container = require('../../../infrastructure/config/container');

// Mantemos o middleware de autorização (agora ele vai funcionar perfeitamente!)
const { eventosController, authenticationMiddleware, authorizationMiddleware } = container;

// Listar (Público)
router.get('/ativo', (req, res, next) => eventosController.ativo(req, res, next));

// Rotas Administrativas (Protegidas com requireAuth e isAdmin)
router.post('/', authenticationMiddleware.requireAuth, authorizationMiddleware.isAdmin(), (req, res, next) => eventosController.criar(req, res, next));
router.post('/ativo/apostas', authenticationMiddleware.requireAuth, authorizationMiddleware.isAdmin(), (req, res, next) => eventosController.toggleApostas(req, res, next));
router.post('/ativo/vencedor', authenticationMiddleware.requireAuth, authorizationMiddleware.isAdmin(), (req, res, next) => eventosController.definirVencedor(req, res, next));
router.post('/resetar', authenticationMiddleware.requireAuth, authorizationMiddleware.isAdmin(), (req, res, next) => eventosController.resetar(req, res, next));

module.exports = router;