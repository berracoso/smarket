const jwt = require('jsonwebtoken');

class AuthenticationMiddleware {
    constructor(sessionManager) {
        this.sessionManager = sessionManager;
    }

    // Lógica interna de verificação estrita
    async handle(req, res, next) {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader) {
                return res.status(401).json({ erro: 'Token não fornecido' });
            }

            const parts = authHeader.split(' ');
            if (parts.length !== 2 || !/^Bearer$/i.test(parts[0])) {
                return res.status(401).json({ erro: 'Token malformatado' });
            }

            const token = parts[1];
            const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET;

            if (!secret) {
                console.error('CRÍTICO: JWT_SECRET não definido.');
                return res.status(500).json({ erro: 'Erro interno de configuração' });
            }

            const decoded = jwt.verify(token, secret);
            
            req.usuario = decoded; 
            req.userId = decoded.id;

            return next();
        } catch (err) {
            console.warn('Falha de autenticação:', err.message);
            return res.status(401).json({ erro: 'Token inválido ou expirado' });
        }
    }

    // Método obrigatório (Bloqueia se não tiver token)
    requireAuth() {
        return (req, res, next) => this.handle(req, res, next);
    }

    // Método opcional (Não bloqueia, apenas identifica se possível)
    optionalAuth() {
        return (req, res, next) => {
            const authHeader = req.headers.authorization;

            // Se não tem token, segue como visitante
            if (!authHeader) return next();

            const parts = authHeader.split(' ');
            if (parts.length !== 2) return next();

            const token = parts[1];
            const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET;

            try {
                const decoded = jwt.verify(token, secret);
                req.usuario = decoded;
                req.userId = decoded.id;
            } catch (err) {
                // Se o token for inválido, apenas ignoramos e seguimos como visitante
                // não retornamos erro 401 aqui para não bloquear a Home
            }
            
            return next();
        };
    }
}

module.exports = AuthenticationMiddleware;