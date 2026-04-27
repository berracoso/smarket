class AuthorizationMiddleware {
    isAdmin() {
        return (req, res, next) => {
            const usuario = req.user; // CORRIGIDO DE req.usuario PARA req.user
            if (!usuario) return res.status(401).json({ erro: 'Usuário não autenticado.' });
            
            if (usuario.isAdmin || usuario.isSuperAdmin) return next();
            
            return res.status(403).json({ erro: 'Acesso negado: Requer privilégios de administrador.' });
        };
    }

    isSuperAdmin() {
        return (req, res, next) => {
            const usuario = req.user; // CORRIGIDO DE req.usuario PARA req.user
            if (!usuario) return res.status(401).json({ erro: 'Usuário não autenticado.' });

            if (usuario.isSuperAdmin) return next();

            return res.status(403).json({ erro: 'Acesso negado: Requer privilégios de Super Admin.' });
        };
    }

    canBet() {
        return (req, res, next) => {
            const usuario = req.user; // CORRIGIDO DE req.usuario PARA req.user
            if (!usuario) return res.status(401).json({ erro: 'Usuário não autenticado.' });

            if (usuario.isSuperAdmin) {
                return res.status(403).json({ erro: 'Super Admins não podem realizar apostas.' });
            }
            
            return next();
        };
    }

    requireAdmin() {
        return this.isAdmin();
    }
}

module.exports = AuthorizationMiddleware;