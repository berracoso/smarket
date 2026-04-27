class AuthenticationMiddleware {
    constructor(usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    requireAuth = async (req, res, next) => {
        // Pega o usuário da sessão, seja ele qual for o nome salvo
        const sessionUser = req.session ? (req.session.user || req.session.usuario) : null;

        if (sessionUser) {
            // A MÁGICA: Injeta todas as variações no request para que NENHUM arquivo quebre
            req.user = sessionUser;
            req.usuario = sessionUser;
            req.userId = sessionUser.id;
            
            return next();
        }

        // Se a requisição espera JSON (API)
        if (req.xhr || (req.headers && req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
            return res.status(401).json({ error: 'Não autorizado. Faça login.' });
        }

        // Se for acesso direto via navegador, redireciona para login
        return res.redirect('/login');
    };
    
    tryAuth = (req, res, next) => {
        const sessionUser = req.session ? (req.session.user || req.session.usuario) : null;
        if (sessionUser) {
            req.user = sessionUser;
            req.usuario = sessionUser;
            req.userId = sessionUser.id;
        }
        next();
    };
}

module.exports = AuthenticationMiddleware;