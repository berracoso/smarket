class ApostasController {
    constructor(criarAposta, listarMinhasApostas, calcularRetornoEstimado) {
        this.criarAposta = criarAposta;
        this.listarMinhasApostas = listarMinhasApostas;
        this.calcularRetornoEstimado = calcularRetornoEstimado;
    }

    async criar(req, res, next) {
        try {
            const { time, valor } = req.body;
            
            // CORREÇÃO CRÍTICA: Pega o ID do token JWT (seguro)
            // e não do body (inseguro)
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

    async minhasApostas(req, res, next) {
        try {
            // Pega ID do token
            const usuarioId = req.usuario.id;
            
            const resultado = await this.listarMinhasApostas.executar({ usuarioId });
            
            res.status(200).json(resultado);
        } catch (erro) {
            next(erro);
        }
    }

    async simular(req, res, next) {
        try {
            const { valor, time } = req.query;
            const retorno = await this.calcularRetornoEstimado.executar({ 
                valor: Number(valor), 
                time 
            });
            res.status(200).json(retorno);
        } catch (erro) {
            next(erro);
        }
    }
}

module.exports = ApostasController;