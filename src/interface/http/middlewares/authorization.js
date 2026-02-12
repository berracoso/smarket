class AuthorizationMiddleware {
    // Admin ou Super Admin (Para painel e gestão)
    isAdmin() {
        return (req, res, next) => {
            const usuario = req.usuario;
            if (!usuario) return res.status(401).json({ erro: 'Usuário não autenticado.' });
            
            if (usuario.isAdmin || usuario.isSuperAdmin) return next();
            
            return res.status(403).json({ erro: 'Acesso negado: Requer privilégios de administrador.' });
        };
    }

    // Apenas Super Admin (Para resetar sistema e promover admins)
    isSuperAdmin() {
        return (req, res, next) => {
            const usuario = req.usuario;
            if (!usuario) return res.status(401).json({ erro: 'Usuário não autenticado.' });

            if (usuario.isSuperAdmin) return next();

            return res.status(403).json({ erro: 'Acesso negado: Requer privilégios de Super Admin.' });
        };
    }

    // Permissão para apostar (Super Admin NÃO pode)
    canBet() {
        return (req, res, next) => {
            const usuario = req.usuario;
            if (!usuario) return res.status(401).json({ erro: 'Usuário não autenticado.' });

            // Regra de Negócio: Super Admin é apenas gestor, não aposta
            if (usuario.isSuperAdmin) {
                return res.status(403).json({ erro: 'Super Admins não podem realizar apostas.' });
            }
            
            return next();
        };
    }

    // Alias para compatibilidade (se alguma rota antiga chamar requireAdmin)
    requireAdmin() {
        return this.isAdmin();
    }
}

module.exports = AuthorizationMiddleware;