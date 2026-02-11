/**
 * Rotas de Autenticação
 * Registro, login e logout
 */

const express = require('express');

module.exports = (authController, authMiddleware) => {
    const router = express.Router();

    /**
     * POST /auth/registro
     * Registra novo usuário
     * Público
     */
    router.post('/registro', (req, res, next) => {
        authController.registro(req, res, next);
    });

    /**
     * POST /auth/login
     * Autentica usuário
     * Público
     */
    router.post('/login', (req, res, next) => {
        authController.login(req, res, next);
    });

    /**
     * POST /auth/logout
     * Encerra sessão
     * Requer autenticação
     */
    router.post('/logout', authMiddleware.requireAuth(), (req, res, next) => {
        authController.logout(req, res, next);
    });

    /**
     * GET /auth/me
     * Retorna dados do usuário autenticado
     * Requer autenticação
     */
    router.get('/me', authMiddleware.requireAuth(), (req, res, next) => {
        authController.me(req, res, next);
    });

    return router;
};
