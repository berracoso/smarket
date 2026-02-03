/**
 * Controller de Usuários
 * Gerencia operações administrativas de usuários
 */

class UsersController {
    constructor(
        listarUsuariosUseCase,
        promoverUsuarioUseCase,
        rebaixarUsuarioUseCase
    ) {
        this.listarUsuariosUseCase = listarUsuariosUseCase;
        this.promoverUsuarioUseCase = promoverUsuarioUseCase;
        this.rebaixarUsuarioUseCase = rebaixarUsuarioUseCase;
    }

    /**
     * GET /usuarios
     * Lista todos os usuários
     */
    async listar(req, res, next) {
        try {
            const resultado = await this.listarUsuariosUseCase.executar();
            res.json(resultado);
        } catch (erro) {
            next(erro);
        }
    }

    /**
     * POST /usuarios/:id/promover
     * Promove usuário para Admin
     */
    async promover(req, res, next) {
        try {
            const userId = parseInt(req.params.id);
            if (isNaN(userId)) {
                return res.status(400).json({ erro: 'ID inválido' });
            }

            const resultado = await this.promoverUsuarioUseCase.executar({ userId });
            
            if (!resultado.sucesso) {
                return res.status(400).json(resultado);
            }

            res.json(resultado);
        } catch (erro) {
            next(erro);
        }
    }

    /**
     * POST /usuarios/:id/rebaixar
     * Rebaixa Admin para Usuário
     */
    async rebaixar(req, res, next) {
        try {
            const userId = parseInt(req.params.id);
            if (isNaN(userId)) {
                return res.status(400).json({ erro: 'ID inválido' });
            }

            const resultado = await this.rebaixarUsuarioUseCase.executar({ userId });

            if (!resultado.sucesso) {
                return res.status(400).json(resultado);
            }

            res.json(resultado);
        } catch (erro) {
            next(erro);
        }
    }
}

module.exports = UsersController;
