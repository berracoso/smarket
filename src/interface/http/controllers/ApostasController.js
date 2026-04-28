class ApostasController {
    constructor(criarAposta, listarMinhasApostas, obterHistoricoApostas, calcularRetornoEstimado) {
        this.criarAposta = criarAposta;
        this.listarMinhasApostas = listarMinhasApostas;
        this.obterHistoricoApostas = obterHistoricoApostas;
        this.calcularRetornoEstimado = calcularRetornoEstimado;
    }

    async criar(req, res, next) {
        try {
            const { time, valor } = req.body;
            const usuarioId = req.usuario.id;

            if (!time || !valor) {
                return res.status(400).json({ erro: 'Time e valor são obrigatórios' });
            }

            const aposta = await this.criarAposta.executar({
                usuarioId,
                time,
                valor
            });

            res.status(201).json({
                mensagem: 'Aposta realizada com sucesso',
                aposta
            });
        } catch (erro) {
            next(erro);
        }
    }

    async minhas(req, res, next) {
        try {
            const usuarioId = req.usuario.id;
            const resultado = await this.listarMinhasApostas.executar({ usuarioId });
            res.status(200).json(resultado);
        } catch (erro) {
            next(erro);
        }
    }

    async historico(req, res, next) {
        try {
            const filtros = {
                usuarioId: req.usuario.id,
                ...req.query
            };
            
            if (!this.obterHistoricoApostas) {
                 return res.status(501).json({ erro: 'Funcionalidade de histórico indisponível no momento.' });
            }

            const resultado = await this.obterHistoricoApostas.executar(filtros);
            res.status(200).json(resultado);
        } catch (erro) {
            next(erro);
        }
    }

    // NOVO MÉTODO: Usado pelo Painel Admin para buscar as apostas de todos os usuários
    async todas(req, res, next) {
        try {
            if (!this.obterHistoricoApostas) {
                return res.status(501).json({ erro: 'Funcionalidade indisponível.' });
            }

            // Ao não passar o usuarioId nos filtros, a maioria dos casos de uso de histórico retorna todas as apostas globais
            const filtrosGlobais = { ...req.query };
            
            const resultado = await this.obterHistoricoApostas.executar(filtrosGlobais);
            res.status(200).json(resultado);
        } catch (erro) {
            next(erro);
        }
    }

    async simular(req, res, next) {
        try {
            const { valor, time } = req.body; 
            const valorFinal = valor || req.query.valor;
            const timeFinal = time || req.query.time;

            const retorno = await this.calcularRetornoEstimado.executar({ 
                valor: Number(valorFinal), 
                time: timeFinal 
            });
            res.status(200).json(retorno);
        } catch (erro) {
            next(erro);
        }
    }
}

module.exports = ApostasController;