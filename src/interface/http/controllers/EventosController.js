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

    // Método utilitário privado para blindar a extração do ID independente do middleware de Auth
    _safeGetUserId(req) {
        const id = req.userId || req.user?.id || req.session?.userId;
        if (!id) throw new Error('Não foi possível identificar o usuário autenticado na requisição.');
        return id;
    }

    async ativo(req, res, next) {
        try {
            const resultado = await this.obterEventoAtivoUseCase.executar();
            res.status(200).json(resultado);
        } catch (erro) {
            next(erro);
        }
    }

    async criar(req, res, next) {
        try {
            const { nome, times } = req.body;
            const userId = this._safeGetUserId(req);

            const resultado = await this.criarNovoEventoUseCase.executar({
                userId,
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
            const userId = this._safeGetUserId(req);

            // Validação estrita do booleano antes de enviar para o Use Case
            const isAbrir = abrir === true || String(abrir).toLowerCase() === 'true';

            const resultado = await this.abrirFecharApostasUseCase.executar({
                userId,
                abrir: isAbrir
            });
            res.status(200).json(resultado);
        } catch (erro) {
            next(erro);
        }
    }

    async definirVencedor(req, res, next) {
        try {
            const { timeVencedor } = req.body;
            const userId = this._safeGetUserId(req);

            const resultado = await this.definirVencedorUseCase.executar({
                userId,
                timeVencedor
            });
            res.status(200).json(resultado);
        } catch (erro) {
            next(erro);
        }
    }

    async resetar(req, res, next) {
        try {
            const { nome, times } = req.body;
            const userId = this._safeGetUserId(req);

            const resultado = await this.resetarEventoUseCase.executar({
                userId,
                nome,
                times
            });
            res.status(200).json(resultado); // Reset é uma operação com 200 OK
        } catch (erro) {
            next(erro);
        }
    }
}

module.exports = EventosController;