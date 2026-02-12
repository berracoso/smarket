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
            // Pega ID do token JWT (seguro)
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

    // Método chamado pela rota GET /minhas
    async minhas(req, res, next) {
        try {
            const usuarioId = req.usuario.id;
            const resultado = await this.listarMinhasApostas.executar({ usuarioId });
            res.status(200).json(resultado);
        } catch (erro) {
            next(erro);
        }
    }

    // Método chamado pela rota GET /historico
    async historico(req, res, next) {
        try {
            // Filtros da query string (pagina, limite, etc)
            const filtros = {
                usuarioId: req.usuario.id,
                ...req.query
            };
            
            // Verifica se o caso de uso existe antes de executar (segurança)
            if (!this.obterHistoricoApostas) {
                 return res.status(501).json({ erro: 'Funcionalidade de histórico indisponível no momento.' });
            }

            const resultado = await this.obterHistoricoApostas.executar(filtros);
            res.status(200).json(resultado);
        } catch (erro) {
            next(erro);
        }
    }

    // Método chamado pela rota POST /simular
    async simular(req, res, next) {
        try {
            const { valor, time } = req.body; // Geralmente POST envia no body
            
            // Fallback para query se vier vazio (caso usem GET ou query params)
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