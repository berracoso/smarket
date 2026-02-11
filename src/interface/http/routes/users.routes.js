/**
 * Rotas de Usuários
 * Gerenciamento de usuários (apenas Admin/Super Admin)
 */

const express = require('express');

module.exports = (usersController, authMiddleware, authorizationMiddleware) => {
    const router = express.Router();

    /**
     * Todas as rotas requerem Autenticação + Admin/SuperAdmin
     */
    router.use(authMiddleware.requireAuth());
    router.use(authorizationMiddleware.requireAdmin());

    /**
     * GET /usuarios
     * Lista todos os usuários
     */
    router.get('/', (req, res, next) => {
        usersController.listar(req, res, next);
    });

    /**
     * POST /usuarios/:id/promover
     * Promove usuário a Admin (apenas Super Admin pode promover?)
     * Por enquanto deixamos Admin também promover, conforme regra antiga
     */
    router.post('/:id/promover', (req, res, next) => {
        usersController.promover(req, res, next);
    });

    /**
     * POST /usuarios/:id/rebaixar
     * Rebaixa Admin a Usuário
     */
    router.post('/:id/rebaixar', (req, res, next) => {
        usersController.rebaixar(req, res, next);
    });

    return router;
};
