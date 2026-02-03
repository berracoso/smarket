/**
 * Use Case: Calcular Retorno Estimado
 * 
 * Calcula o retorno estimado de uma aposta em um time específico.
 * Usa o CalculadoraProbabilidade do Domain Layer.
 */

const CalculadoraPremios = require('../../../domain/services/CalculadoraPremios');
const TaxaPlataforma = require('../../../domain/value-objects/TaxaPlataforma');

class CalcularRetornoEstimado {
    constructor(apostaRepository, eventoRepository) {
        this.apostaRepository = apostaRepository;
        this.eventoRepository = eventoRepository;
        this.calculadora = new CalculadoraPremios(new TaxaPlataforma());
    }

    /**
     * Executa o caso de uso
     * @param {Object} dados - { time, valor }
     * @returns {Promise<Object>} { sucesso: true, retornoEstimado, ... }
     */
    async executar({ time, valor }) {
        // 1. Buscar evento ativo
        const evento = await this.eventoRepository.buscarEventoAtivo();
        if (!evento) {
            throw new Error('Nenhum evento ativo no momento');
        }

        // 2. Validar se o time existe
        if (!evento.contemTime(time)) {
            throw new Error('Time não existe neste evento');
        }

        // 3. Buscar todas as apostas do evento
        const apostas = await this.apostaRepository.listarPorEvento(evento.id);

        // 4. Calcular total por time
        const totalPorTime = {};
        evento.times.forEach(t => {
            totalPorTime[t] = 0;
        });

        apostas.forEach(aposta => {
            totalPorTime[aposta.time] += aposta.getValorNumerico();
        });

        // 5. Adicionar a aposta simulada ao time
        const totalTimeComAposta = totalPorTime[time] + parseFloat(valor);

        // 6. Calcular total arrecadado
        const totalArrecadado = Object.values(totalPorTime).reduce((sum, val) => sum + val, 0) + parseFloat(valor);

        // 7. Calcular retorno estimado
        const retornoEstimado = this.calculadora.calcularRetornoEstimado(
            parseFloat(valor),
            totalTimeComAposta,
            totalArrecadado
        );

        const lucroEstimado = retornoEstimado - parseFloat(valor);

        return {
            sucesso: true,
            time,
            valorAposta: parseFloat(valor),
            retornoEstimado: parseFloat(retornoEstimado.toFixed(2)),
            lucroEstimado: parseFloat(lucroEstimado.toFixed(2)),
            totalNoTime: parseFloat(totalTimeComAposta.toFixed(2)),
            totalArrecadado: parseFloat(totalArrecadado.toFixed(2)),
            taxaPlataforma: 0.05
        };
    }
}

module.exports = CalcularRetornoEstimado;
