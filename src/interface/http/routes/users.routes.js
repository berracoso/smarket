const express = require('express');
const router = express.Router();
const container = require('../../../infrastructure/config/container');

const { usersController, authenticationMiddleware } = container;

// Protege todas as rotas
router.use(authenticationMiddleware.requireAuth);

// Só define a rota se o controller existir
if (usersController) {
    router.get('/', (req, res, next) => usersController.listar(req, res, next));
    // Adicione outras rotas de usuário aqui (ex: promover, rebaixar)
}

module.exports = router;