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

    async ativo(req, res, next) {
        try {
            const resultado = await this.obterEventoAtivoUseCase.executar();
            res.json(resultado);
        } catch (erro) {
            next(erro);
        }
    }

    async criar(req, res, next) {
        try {
            const { nome, times } = req.body;
            const resultado = await this.criarNovoEventoUseCase.executar({
                userId: req.user.id, // CORRIGIDO AQUI
                nome,
                times
            });
            res.status(201).json(resultado);
        } catch (erro) {
            next(erro);
        }
    }

    async toggleApostas(req, res, next) {
        try {
            const { abrir } = req.body;
            const resultado = await this.abrirFecharApostasUseCase.executar({
                userId: req.user.id, // CORRIGIDO AQUI
                abrir: abrir === true || abrir === 'true'
            });
            res.json(resultado);
        } catch (erro) {
            next(erro);
        }
    }

    async definirVencedor(req, res, next) {
        try {
            const { timeVencedor } = req.body;
            const resultado = await this.definirVencedorUseCase.executar({
                userId: req.user.id, // CORRIGIDO AQUI
                timeVencedor
            });
            res.json(resultado);
        } catch (erro) {
            next(erro);
        }
    }

    async resetar(req, res, next) {
        try {
            const { nome, times } = req.body;
            const resultado = await this.resetarEventoUseCase.executar({
                userId: req.user.id, // CORRIGIDO AQUI
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