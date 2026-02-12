const express = require('express');
const router = express.Router();
const container = require('../../../infrastructure/config/container');

const { apostasController, authenticationMiddleware } = container;

// Aplica autenticação em todas as rotas de apostas
router.use(authenticationMiddleware.requireAuth);

router.post('/', (req, res, next) => apostasController.criar(req, res, next));
router.get('/minhas', (req, res, next) => apostasController.listarMinhas(req, res, next));

module.exports = router;