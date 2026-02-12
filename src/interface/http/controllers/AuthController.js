class AuthController {
    constructor(fazerLogin, registrarUsuario) {
        this.fazerLogin = fazerLogin;
        this.registrarUsuario = registrarUsuario;
    }

    async login(req, res, next) {
        try {
            const { email, senha } = req.body;
            const resultado = await this.fazerLogin.executar({ email, senha });
            
            // Salva na sessão do Postgres (connect-pg-simple)
            req.session.user = {
                id: resultado.usuario.id,
                nome: resultado.usuario.nome,
                email: resultado.usuario.email.endereco,
                tipo: resultado.usuario.tipo,
                isAdmin: resultado.usuario.isAdmin,
                isSuperAdmin: resultado.usuario.isSuperAdmin
            };

            // Salva explicitamente para garantir que o cookie seja enviado
            req.session.save((err) => {
                if (err) return next(err);
                return res.json({ success: true, user: req.session.user });
            });

        } catch (error) {
            next(error);
        }
    }

    async register(req, res, next) {
        try {
            const { nome, email, senha } = req.body;
            await this.registrarUsuario.executar({ nome, email, senha });
            res.status(201).json({ success: true, message: 'Usuário registrado com sucesso' });
        } catch (error) {
            next(error);
        }
    }

    async logout(req, res, next) {
        req.session.destroy((err) => {
            if (err) return next(err);
            res.clearCookie('connect.sid'); // Nome padrão do cookie de sessão
            return res.json({ success: true, message: 'Logout realizado' });
        });
    }

    async me(req, res, next) {
        if (!req.user) {
            return res.status(401).json({ error: 'Não autenticado' });
        }
        res.json(req.user);
    }
}

module.exports = AuthController;