const express = require('express');
const router = express.Router();
const container = require('../../../infrastructure/config/container');

const { eventosController, authenticationMiddleware } = container;

// Listar (Público)
router.get('/', (req, res, next) => eventosController.listar(req, res, next));
router.get('/:id', (req, res, next) => eventosController.buscarPorId(req, res, next));

// Rotas Administrativas (Protegidas)
router.post('/', authenticationMiddleware.requireAuth, (req, res, next) => eventosController.criar(req, res, next));
router.put('/:id/status', authenticationMiddleware.requireAuth, (req, res, next) => eventosController.alterarStatus(req, res, next));
router.post('/:id/vencedor', authenticationMiddleware.requireAuth, (req, res, next) => eventosController.definirVencedor(req, res, next));

module.exports = router;