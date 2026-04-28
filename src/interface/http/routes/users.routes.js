const express = require('express');
const router = express.Router();
const container = require('../../../infrastructure/config/container');

const { usersController, authenticationMiddleware, authorizationMiddleware } = container;

// Protege todas as rotas
router.use(authenticationMiddleware.requireAuth);

if (usersController) {
    // Apenas Admin pode listar os usuários
    router.get('/', authorizationMiddleware.isAdmin(), (req, res, next) => usersController.listar(req, res, next));
    
    // Novas rotas ativadas para o admin promover e rebaixar
    router.post('/:id/promover', authorizationMiddleware.isAdmin(), (req, res, next) => usersController.promover(req, res, next));
    router.post('/:id/rebaixar', authorizationMiddleware.isAdmin(), (req, res, next) => usersController.rebaixar(req, res, next));
}

module.exports = router;