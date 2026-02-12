const jwt = require('jsonwebtoken');

class AuthenticationMiddleware {
    constructor(sessionManager) {
        this.sessionManager = sessionManager;
    }

    // Este é o método que o Express chama internamente
    async handle(req, res, next) {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader) {
                return res.status(401).json({ erro: 'Token não fornecido' });
            }

            const parts = authHeader.split(' ');
            if (parts.length !== 2) {
                return res.status(401).json({ erro: 'Erro no formato do token' });
            }

            const [scheme, token] = parts;

            if (!/^Bearer$/i.test(scheme)) {
                return res.status(401).json({ erro: 'Token malformatado' });
            }

            const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET;
            if (!secret) {
                throw new Error('JWT_SECRET/SESSION_SECRET não configurado');
            }

            const decoded = jwt.verify(token, secret);
            
            // Injeta o usuário na requisição
            req.usuario = decoded; 
            req.userId = decoded.id;

            return next();
        } catch (err) {
            console.error('Erro de autenticação:', err.message);
            return res.status(401).json({ erro: 'Token inválido ou expirado' });
        }
    }

    // ADAPTER: Este é o método que suas rotas estão chamando (o "requireAuth()")
    requireAuth() {
        return (req, res, next) => this.handle(req, res, next);
    }
}

module.exports = AuthenticationMiddleware;