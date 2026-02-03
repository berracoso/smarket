/**
 * Rotas de Apostas
 * Criação, listagem e simulação de apostas
 */

const express = require('express');

module.exports = (apostasController, authMiddleware, authorizationMiddleware) => {
    const router = express.Router();

    /**
     * Todas as rotas requerem autenticação
     */
    router.use(authMiddleware.requireAuth());

    /**
     * POST /apostas
     * Cria nova aposta
     * Requer: Autenticação + Permissão para apostar (não Super Admin)
     */
    router.post('/', authorizationMiddleware.canBet(), (req, res, next) => {
        apostasController.criar(req, res, next);
    });

    /**
     * GET /apostas/minhas
     * Lista apostas do usuário no evento ativo
     * Requer: Autenticação
     */
    router.get('/minhas', (req, res, next) => {
        apostasController.minhas(req, res, next);
    });

    /**
     * GET /apostas/historico
     * Lista histórico completo de apostas
     * Requer: Autenticação
     * Query params: eventoId?, limite?, pagina?
     */
    router.get('/historico', (req, res, next) => {
        apostasController.historico(req, res, next);
    });

    /**
     * POST /apostas/simular
     * Calcula retorno estimado de uma aposta
     * Requer: Autenticação
     */
    router.post('/simular', (req, res, next) => {
        apostasController.simular(req, res, next);
    });

    return router;
};
