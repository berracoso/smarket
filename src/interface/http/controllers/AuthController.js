/**
 * Controller de Autenticação
 * Gerencia registro, login e logout
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
     * Registra novo usuário
     */
    async registro(req, res, next) {
        try {
            const { nome, email, senha } = req.body;

            const resultado = await this.registrarUsuarioUseCase.executar({
                nome,
                email,
                senha
            });

            // Criar sessão automaticamente
            this.sessionManager.criarSessao(req, resultado.usuario.id, resultado.usuario);

            res.status(201).json(resultado);
        } catch (erro) {
            next(erro);
        }
    }

    /**
     * POST /auth/login
     * Autentica usuário
     */
    async login(req, res, next) {
        try {
            const { email, senha } = req.body;

            const resultado = await this.fazerLoginUseCase.executar({
                email,
                senha
            });

            // Criar sessão
            this.sessionManager.criarSessao(req, resultado.usuario.id, resultado.usuario);

            res.json(resultado);
        } catch (erro) {
            next(erro);
        }
    }

    /**
     * POST /auth/logout
     * Encerra sessão
     */
    async logout(req, res, next) {
        try {
            await this.fazerLogoutUseCase.executar();

            // Destruir sessão
            await this.sessionManager.destruirSessao(req);

            res.json({
                sucesso: true,
                mensagem: 'Logout realizado com sucesso'
            });
        } catch (erro) {
            next(erro);
        }
    }

    /**
     * GET /auth/me
     * Retorna dados do usuário autenticado
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
