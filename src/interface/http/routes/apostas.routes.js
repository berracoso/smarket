const express = require('express');
const router = express.Router();
const container = require('../../../infrastructure/config/container');

const { apostasController, authenticationMiddleware, authorizationMiddleware } = container;

// Aplica autenticação em todas as rotas de apostas
router.use(authenticationMiddleware.requireAuth);

router.post('/', (req, res, next) => apostasController.criar(req, res, next));

// Correção no nome do método para bater com o controller ("minhas" em vez de "listarMinhas")
router.get('/minhas', (req, res, next) => apostasController.minhas(req, res, next));

// NOVA ROTA: Permite que o administrador veja todas as apostas do sistema
if (authorizationMiddleware) {
    router.get('/todas', authorizationMiddleware.isAdmin(), (req, res, next) => apostasController.todas(req, res, next));
}

module.exports = router;