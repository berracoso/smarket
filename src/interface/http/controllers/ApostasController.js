/**
 * Controller de Apostas
 * Gerencia apostas dos usuários
 */

class ApostasController {
    constructor(
        criarApostaUseCase,
        listarMinhasApostasUseCase,
        calcularRetornoEstimadoUseCase,
        obterHistoricoApostasUseCase
    ) {
        this.criarApostaUseCase = criarApostaUseCase;
        this.listarMinhasApostasUseCase = listarMinhasApostasUseCase;
        this.calcularRetornoEstimadoUseCase = calcularRetornoEstimadoUseCase;
        this.obterHistoricoApostasUseCase = obterHistoricoApostasUseCase;
    }

    /**
     * POST /apostas
     * Cria nova aposta
     */
    async criar(req, res, next) {
        try {
            const { time, valor } = req.body;

            const resultado = await this.criarApostaUseCase.executar({
                userId: req.userId,
                time,
                valor
            });

            res.status(201).json(resultado);
        } catch (erro) {
            next(erro);
        }
    }

    /**
     * GET /apostas/minhas
     * Lista apostas do usuário no evento ativo
     */
    async minhas(req, res, next) {
        try {
            const resultado = await this.listarMinhasApostasUseCase.executar(req.userId);

            res.json(resultado);
        } catch (erro) {
            next(erro);
        }
    }

    /**
     * GET /apostas/historico
     * Lista histórico completo de apostas
     */
    async historico(req, res, next) {
        try {
            const { eventoId, dataInicio, dataFim, limite = 5, pagina = 1 } = req.query;

            const resultado = await this.obterHistoricoApostasUseCase.executar({
                userId: req.userId,
                eventoId: eventoId ? parseInt(eventoId) : null,
                dataInicio: dataInicio || null,
                dataFim: dataFim || null,
                limite: parseInt(limite),
                pagina: parseInt(pagina)
            });

            res.json(resultado);
        } catch (erro) {
            next(erro);
        }
    }

    /**
     * POST /apostas/simular
     * Calcula retorno estimado de uma aposta
     */
    async simular(req, res, next) {
        try {
            const { time, valor } = req.body;

            const resultado = await this.calcularRetornoEstimadoUseCase.executar({
                time,
                valor
            });

            res.json(resultado);
        } catch (erro) {
            next(erro);
        }
    }
}

module.exports = ApostasController;
