/**
 * Middleware de Autenticação
 * Verifica se o usuário está autenticado via token JWT
 */
class AuthenticationMiddleware {
    constructor(sessionManager) {
        this.sessionManager = sessionManager;
    }

    /**
     * Middleware para verificar autenticação (Bloqueia se inválido)
     */
    requireAuth() {
        return (req, res, next) => {
            // Tenta pegar o token do header Authorization: Bearer <token>
            let token = null;
            const authHeader = req.headers.authorization;
            
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            } else if (req.body.token) {
                token = req.body.token; // Fallback
            }

            if (!token) {
                return res.status(401).json({
                    sucesso: false,
                    erro: 'Token não fornecido. Faça login para continuar.'
                });
            }

            try {
                // Verifica o token usando o sessionManager
                const decoded = this.sessionManager.verificarToken(token);
                
                // Anexa o ID do usuário ao request
                req.userId = decoded.id;
                req.usuario = decoded; // Dados básicos (nome, email, tipo)
                next();
            } catch (err) {
                return res.status(401).json({
                    sucesso: false,
                    erro: 'Sessão inválida ou expirada.'
                });
            }
        };
    }

    /**
     * Middleware opcional - não bloqueia se falhar, apenas não popula o user
     */
    optionalAuth() {
        return (req, res, next) => {
            let token = null;
            const authHeader = req.headers.authorization;
            
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }

            if (token) {
                try {
                    const decoded = this.sessionManager.verificarToken(token);
                    req.userId = decoded.id;
                    req.usuario = decoded;
                } catch (err) {
                    // Ignora erro no opcional
                }
            }
            next();
        };
    }
}

module.exports = AuthenticationMiddleware;