/**
 * Middleware de Autenticação
 * Verifica se o usuário está autenticado via sessão
 */

class AuthenticationMiddleware {
    constructor(sessionManager) {
        this.sessionManager = sessionManager;
    }

    /**
     * Middleware para verificar autenticação
     * @returns {Function} Express middleware
     */
    requireAuth() {
        return (req, res, next) => {
            if (!this.sessionManager.estaAutenticado(req)) {
                return res.status(401).json({
                    sucesso: false,
                    erro: 'Não autenticado. Faça login para continuar.'
                });
            }

            // Anexar userId ao request para facilitar acesso
            req.userId = req.session.userId;
            next();
        };
    }

    /**
     * Middleware opcional - continua mesmo sem autenticação
     * Útil para rotas que podem ser acessadas por qualquer um
     * @returns {Function} Express middleware
     */
    optionalAuth() {
        return (req, res, next) => {
            if (this.sessionManager.estaAutenticado(req)) {
                req.userId = req.session.userId;
            }
            next();
        };
    }
}

module.exports = AuthenticationMiddleware;
