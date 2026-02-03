/**
 * Domain Service: CalculadoraProbabilidade
 * Calcula probabilidades baseadas no volume de apostas (modelo Pari-Mutuel)
 * 
 * Fórmula:
 * Probabilidade(Time X) = Total apostado no Time X / Total geral apostado
 */

class CalculadoraProbabilidade {
    calcular(apostas, times) {
        const totalGeral = this._calcularTotalGeral(apostas);
        
        const probabilidades = {};

        times.forEach(time => {
            const totalTime = this._calcularTotalTime(apostas, time);
            const probabilidade = totalGeral > 0 ? totalTime / totalGeral : 0;
            
            probabilidades[time] = {
                total: totalTime,
                probabilidade: probabilidade,
                percentual: parseFloat((probabilidade * 100).toFixed(2))
            };
        });

        return probabilidades;
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

    calcularProbabilidadeTime(apostas, time) {
        const totalGeral = this._calcularTotalGeral(apostas);
        const totalTime = this._calcularTotalTime(apostas, time);
        
        return totalGeral > 0 ? totalTime / totalGeral : 0;
    }
}

module.exports = CalculadoraProbabilidade;
