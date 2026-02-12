class AuthorizationMiddleware {
    // Verifica se é Admin ou Super Admin
    isAdmin() {
        return (req, res, next) => {
            const usuario = req.usuario;

            if (!usuario) {
                return res.status(401).json({ erro: 'Usuário não autenticado.' });
            }

            if (usuario.isAdmin || usuario.isSuperAdmin) {
                return next();
            }

            return res.status(403).json({ erro: 'Acesso negado: Requer privilégios de administrador.' });
        };
    }

    // Verifica se é estritamente Super Admin
    isSuperAdmin() {
        return (req, res, next) => {
            const usuario = req.usuario;

            if (!usuario) {
                return res.status(401).json({ erro: 'Usuário não autenticado.' });
            }

            if (usuario.isSuperAdmin) {
                return next();
            }

            return res.status(403).json({ erro: 'Acesso negado: Requer privilégios de Super Admin.' });
        };
    }
}

module.exports = AuthorizationMiddleware;