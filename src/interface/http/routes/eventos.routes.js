/**
 * Rotas de Eventos
 * Gerenciamento de eventos (Admin/Super Admin)
 */

const express = require('express');

module.exports = (eventosController, authMiddleware, authorizationMiddleware) => {
    const router = express.Router();

    /**
     * GET /eventos/ativo
     * Retorna evento ativo com estatísticas
     * Público (opcional auth)
     */
    router.get('/ativo', authMiddleware.optionalAuth(), (req, res, next) => {
        eventosController.ativo(req, res, next);
    });

    /**
     * GET /eventos
     * Lista eventos (para histórico - qualquer usuário autenticado)
     */
    router.get('/', authMiddleware.optionalAuth(), async (req, res, next) => {
        try {
            // Retornar evento ativo no formato de lista
            const container = require('../../../infrastructure/config/container');
            const obterEventoAtivo = container.get('obterEventoAtivo');
            
            const resultado = await obterEventoAtivo.executar();
            
            if (resultado.evento) {
                res.json({ eventos: [resultado.evento] });
            } else {
                res.json({ eventos: [] });
            }
        } catch (erro) {
            next(erro);
        }
    });

    /**
     * Rotas abaixo requerem Admin ou Super Admin
     */
    router.use(authMiddleware.requireAuth());
    router.use(authorizationMiddleware.requireAdmin());

    /**
     * POST /eventos
     * Cria novo evento
     * Requer: Admin ou Super Admin
     */
    router.post('/', (req, res, next) => {
        eventosController.criar(req, res, next);
    });

    /**
     * PATCH /eventos/ativo/apostas
     * Abre ou fecha apostas
     * Requer: Admin ou Super Admin
     */
    router.patch('/ativo/apostas', (req, res, next) => {
        eventosController.toggleApostas(req, res, next);
    });

    /**
     * POST /eventos/ativo/vencedor
     * Define vencedor e finaliza evento
     * Requer: Admin ou Super Admin
     */
    router.post('/ativo/vencedor', (req, res, next) => {
        eventosController.definirVencedor(req, res, next);
    });

    /**
     * POST /eventos/resetar
     * Arquiva evento atual e cria novo
     * Requer: Admin ou Super Admin
     */
    router.post('/resetar', (req, res, next) => {
        eventosController.resetar(req, res, next);
    });

    return router;
};
