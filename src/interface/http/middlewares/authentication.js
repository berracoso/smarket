const jwt = require('jsonwebtoken');

class AuthenticationMiddleware {
    constructor(sessionManager) {
        this.sessionManager = sessionManager;
    }

    async handle(req, res, next) {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader) {
                return res.status(401).json({ erro: 'Token não fornecido' });
            }

            // O formato correto é "Bearer <token>"
            const parts = authHeader.split(' ');
            if (parts.length !== 2) {
                return res.status(401).json({ erro: 'Erro no formato do token' });
            }

            const [scheme, token] = parts;

            if (!/^Bearer$/i.test(scheme)) {
                return res.status(401).json({ erro: 'Token malformatado' });
            }

            // Validação direta via JWT se o SessionManager for complexo demais, 
            // ou usamos o SessionManager se ele apenas encapsular isso.
            // Por segurança, vamos decodificar direto aqui para garantir compatibilidade.
            const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET;
            if (!secret) {
                throw new Error('JWT_SECRET não configurado no .env');
            }

            const decoded = jwt.verify(token, secret);
            
            // Injeta o usuário na requisição para os Controllers usarem
            req.usuario = decoded; 
            req.userId = decoded.id; // Atalho útil

            return next();
        } catch (err) {
            console.error('Erro de autenticação:', err.message);
            return res.status(401).json({ erro: 'Token inválido ou expirado' });
        }
    }
}

module.exports = AuthenticationMiddleware;