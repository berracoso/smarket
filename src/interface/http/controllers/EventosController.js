/**
 * Controller de Eventos
 * Gerencia eventos e suas ações (Admin/Super Admin)
 */

class EventosController {
    constructor(
        criarNovoEventoUseCase,
        obterEventoAtivoUseCase,
        abrirFecharApostasUseCase,
        definirVencedorUseCase,
        resetarEventoUseCase
    ) {
        this.criarNovoEventoUseCase = criarNovoEventoUseCase;
        this.obterEventoAtivoUseCase = obterEventoAtivoUseCase;
        this.abrirFecharApostasUseCase = abrirFecharApostasUseCase;
        this.definirVencedorUseCase = definirVencedorUseCase;
        this.resetarEventoUseCase = resetarEventoUseCase;
    }

    /**
     * GET /eventos/ativo
     * Retorna evento ativo com estatísticas
     */
    async ativo(req, res, next) {
        try {
            const resultado = await this.obterEventoAtivoUseCase.executar();

            res.json(resultado);
        } catch (erro) {
            next(erro);
        }
    }

    /**
     * POST /eventos
     * Cria novo evento (Admin/Super Admin)
     */
    async criar(req, res, next) {
        try {
            const { nome, times } = req.body;

            const resultado = await this.criarNovoEventoUseCase.executar({
                userId: req.userId,
                nome,
                times
            });

            res.status(201).json(resultado);
        } catch (erro) {
            next(erro);
        }
    }

    /**
     * PATCH /eventos/ativo/apostas
     * Abre ou fecha apostas (Admin/Super Admin)
     */
    async toggleApostas(req, res, next) {
        try {
            const { abrir } = req.body;

            const resultado = await this.abrirFecharApostasUseCase.executar({
                userId: req.userId,
                abrir: abrir === true || abrir === 'true'
            });

            res.json(resultado);
        } catch (erro) {
            next(erro);
        }
    }

    /**
     * POST /eventos/ativo/vencedor
     * Define vencedor e finaliza evento (Admin/Super Admin)
     */
    async definirVencedor(req, res, next) {
        try {
            const { timeVencedor } = req.body;

            const resultado = await this.definirVencedorUseCase.executar({
                userId: req.userId,
                timeVencedor
            });

            res.json(resultado);
        } catch (erro) {
            next(erro);
        }
    }

    /**
     * POST /eventos/resetar
     * Arquiva evento atual e cria novo (Admin/Super Admin)
     */
    async resetar(req, res, next) {
        try {
            const { nome, times } = req.body;

            const resultado = await this.resetarEventoUseCase.executar({
                userId: req.userId,
                nome,
                times
            });

            res.json(resultado);
        } catch (erro) {
            next(erro);
        }
    }
}

module.exports = EventosController;
