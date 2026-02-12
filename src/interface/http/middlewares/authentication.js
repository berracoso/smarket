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
            try {
                // 1. Tentar pegar do header Authorization
                let token = req.headers['authorization'];

                // 2. Fallback para x-access-token
                if (!token) {
                    token = req.headers['x-access-token'];
                }

                // 3. Fallback para body
                if (!token && req.body && req.body.token) {
                    token = req.body.token;
                }

                // 4. Limpeza do prefixo "Bearer " se existir
                if (token && token.startsWith('Bearer ')) {
                    token = token.slice(7, token.length).trim();
                }

                // Se ainda não tiver token, retorna erro
                if (!token) {
                    return res.status(401).json({
                        sucesso: false,
                        erro: 'Token não fornecido. Faça login para continuar.',
                        tipo: 'auth_required'
                    });
                }

                // 5. Verificar validade do token
                const decoded = this.sessionManager.verificarToken(token);
                
                // 6. Anexar dados do usuário à requisição
                req.userId = decoded.id;     // Para compatibilidade
                req.usuario = decoded;       // Objeto completo
                
                next();
            } catch (err) {
                return res.status(401).json({
                    sucesso: false,
                    erro: 'Sessão inválida ou expirada.',
                    tipo: 'auth_required'
                });
            }
        };
    }

    /**
     * Middleware opcional - não bloqueia se falhar, apenas não popula o user
     */
    optionalAuth() {
        return (req, res, next) => {
            let token = req.headers['authorization'];
            
            if (token && token.startsWith('Bearer ')) {
                token = token.slice(7, token.length).trim();
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