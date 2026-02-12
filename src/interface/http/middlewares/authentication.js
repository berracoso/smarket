class AuthenticationMiddleware {
    constructor(usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    // Usamos arrow function para não perder o 'this'
    requireAuth = async (req, res, next) => {
        // 1. Verifica se existe sessão ativa (criada pelo connect-pg-simple)
        if (req.session && req.session.user) {
            // Sessão válida! Passa o usuário para o request
            req.user = req.session.user;
            return next();
        }

        // 2. Se não tiver sessão, retorna erro 401
        // Se a requisição espera JSON (API)
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(401).json({ error: 'Não autorizado. Faça login.' });
        }

        // Se for acesso direto via navegador, redireciona para login
        return res.redirect('/login');
    };
    
    // Opcional: Middleware para apenas injetar usuário se existir, sem bloquear
    tryAuth = (req, res, next) => {
        if (req.session && req.session.user) {
            req.user = req.session.user;
        }
        next();
    };
}

module.exports = AuthenticationMiddleware;