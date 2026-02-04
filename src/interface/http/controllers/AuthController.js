/**
 * Controller de Autenticação - CORRIGIDO (Save Session)
 * Gerencia registro, login e logout com garantia de persistência da sessão.
 */

class AuthController {
    constructor(registrarUsuarioUseCase, fazerLoginUseCase, fazerLogoutUseCase, obterUsuarioAtualUseCase, sessionManager) {
        this.registrarUsuarioUseCase = registrarUsuarioUseCase;
        this.fazerLoginUseCase = fazerLoginUseCase;
        this.fazerLogoutUseCase = fazerLogoutUseCase;
        this.obterUsuarioAtualUseCase = obterUsuarioAtualUseCase;
        this.sessionManager = sessionManager;
    }

    /**
     * POST /auth/registro
     */
    async registro(req, res, next) {
        try {
            const { nome, email, senha } = req.body;

            const resultado = await this.registrarUsuarioUseCase.executar({
                nome,
                email,
                senha
            });

            this.sessionManager.criarSessao(req, resultado.usuario.id, resultado.usuario);

            // 🔒 FIX: Força o salvamento da sessão antes de responder
            req.session.save((err) => {
                if (err) {
                    console.error('Erro ao salvar sessão no registro:', err);
                    return next(err);
                }
                res.status(201).json(resultado);
            });

        } catch (erro) {
            next(erro);
        }
    }

    /**
     * POST /auth/login
     */
    async login(req, res, next) {
        try {
            const { email, senha } = req.body;

            const resultado = await this.fazerLoginUseCase.executar({
                email,
                senha
            });

            // Cria a sessão na memória
            this.sessionManager.criarSessao(req, resultado.usuario.id, resultado.usuario);

            // 🔒 FIX CRÍTICO: Espera a sessão ser gravada no disco/memória
            // Isso impede que o redirecionamento aconteça antes do login "pegar"
            req.session.save((err) => {
                if (err) {
                    console.error('Erro ao salvar sessão no login:', err);
                    return next(err);
                }
                console.log(`✅ Login salvo com sucesso para: ${email}`);
                res.json(resultado);
            });

        } catch (erro) {
            next(erro);
        }
    }

    /**
     * POST /auth/logout
     */
    async logout(req, res, next) {
        try {
            await this.fazerLogoutUseCase.executar();
            await this.sessionManager.destruirSessao(req);
            res.json({ sucesso: true, mensagem: 'Logout realizado com sucesso' });
        } catch (erro) {
            next(erro);
        }
    }

    /**
     * GET /auth/me
     */
    async me(req, res, next) {
        try {
            const resultado = await this.obterUsuarioAtualUseCase.executar(req.userId);
            res.json(resultado);
        } catch (erro) {
            next(erro);
        }
    }
}

module.exports = AuthController;
