const express = require('express');
const router = express.Router();
const container = require('../../../infrastructure/config/container');

const { eventosController, authenticationMiddleware } = container;

// Listar (Público)
router.get('/ativo', (req, res, next) => eventosController.ativo(req, res, next));
// Se precisar buscar todos ou por ID, adicione os métodos adequados aqui se eles existirem no controller

// Rotas Administrativas (Protegidas)
router.post('/', authenticationMiddleware.requireAuth, (req, res, next) => eventosController.criar(req, res, next));
router.post('/ativo/apostas', authenticationMiddleware.requireAuth, (req, res, next) => eventosController.toggleApostas(req, res, next));
router.post('/ativo/vencedor', authenticationMiddleware.requireAuth, (req, res, next) => eventosController.definirVencedor(req, res, next));
router.post('/resetar', authenticationMiddleware.requireAuth, (req, res, next) => eventosController.resetar(req, res, next));

module.exports = router;