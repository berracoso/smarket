/**
 * Domain Service: CalculadoraPremios
 * Calcula distribuição de prêmios entre vencedores
 * 
 * Modelo: Pari-Mutuel com taxa da plataforma
 * 
 * Fórmulas:
 * - Total Prêmio = Total Geral × (1 - Taxa)
 * - Ganho Individual = (Valor Apostado / Total Time Vencedor) × Total Prêmio
 * - Lucro = Ganho - Valor Apostado
 */

const TaxaPlataforma = require('../value-objects/TaxaPlataforma');

class CalculadoraPremios {
    constructor(taxaPlataforma) {
        this.taxaPlataforma = taxaPlataforma instanceof TaxaPlataforma 
            ? taxaPlataforma 
            : new TaxaPlataforma(taxaPlataforma || 0.05);
    }

    calcularResumo(apostas, evento) {
        const totalGeral = this._calcularTotalGeral(apostas);
        const taxaValor = this.taxaPlataforma.calcularTaxa(totalGeral);
        const totalPremio = this.taxaPlataforma.calcularPremioLiquido(totalGeral);

        const times = {};
        evento.times.forEach(time => {
            const totalTime = this._calcularTotalTime(apostas, time);
            const probabilidade = totalGeral > 0 ? totalTime / totalGeral : 0;

            times[time] = {
                total: totalTime,
                probabilidade: probabilidade,
                percentual: (probabilidade * 100).toFixed(2)
            };
        });

        return {
            totalGeral,
            taxaPlataforma: taxaValor,
            totalPremio,
            percentualTaxa: this.taxaPlataforma.percentualFormatado,
            times,
            aberto: evento.aberto,
            vencedor: evento.vencedor
        };
    }

    calcularRetornoEstimado(apostas, time, valorAposta) {
        const valorNumerico = typeof valorAposta === 'number' ? valorAposta : valorAposta.toFloat();
        
        const totalGeral = this._calcularTotalGeral(apostas) + valorNumerico;
        const totalPremio = this.taxaPlataforma.calcularPremioLiquido(totalGeral);
        const totalTime = this._calcularTotalTime(apostas, time) + valorNumerico;

        if (totalTime === 0) return 0;

        return (valorNumerico / totalTime) * totalPremio;
    }

    calcularDistribuicao(apostas, timeVencedor) {
        const totalGeral = this._calcularTotalGeral(apostas);
        const totalPremio = this.taxaPlataforma.calcularPremioLiquido(totalGeral);
        const totalVencedor = this._calcularTotalTime(apostas, timeVencedor);

        if (totalVencedor === 0) {
            return [];
        }

        const vencedores = apostas
            .filter(aposta => aposta.time === timeVencedor)
            .map(aposta => {
                const valorApostado = typeof aposta.valor === 'number' ? aposta.valor : aposta.valor.toFloat();
                const ganho = (valorApostado / totalVencedor) * totalPremio;
                const lucro = ganho - valorApostado;

                return {
                    nome: aposta.nome,
                    apostado: valorApostado,
                    ganho: parseFloat(ganho.toFixed(2)),
                    lucro: parseFloat(lucro.toFixed(2))
                };
            });

        return vencedores;
    }

    _calcularTotalGeral(apostas) {
        return apostas.reduce((soma, aposta) => {
            const valor = typeof aposta.valor === 'number' ? aposta.valor : aposta.valor.toFloat();
            return soma + valor;
        }, 0);
    }

    _calcularTotalTime(apostas, time) {
        return apostas
            .filter(aposta => aposta.time === time)
            .reduce((soma, aposta) => {
                const valor = typeof aposta.valor === 'number' ? aposta.valor : aposta.valor.toFloat();
                return soma + valor;
            }, 0);
    }
}

module.exports = CalculadoraPremios;
