/**
 * Value Object: ValorAposta
 * Representa e valida o valor monetário de uma aposta
 * 
 * Regras de Negócio:
 * - Valor mínimo: R$ 1.00
 * - Deve ser um número positivo
 */

class ValorAposta {
    constructor(valor) {
        this.valor = this._validar(valor);
    }

    _validar(valor) {
        const valorNumerico = parseFloat(valor);

        if (isNaN(valorNumerico)) {
            throw new Error('Valor da aposta deve ser um número');
        }

        if (valorNumerico < 1) {
            throw new Error('Valor mínimo da aposta é R$ 1,00');
        }

        if (valorNumerico <= 0) {
            throw new Error('Valor da aposta deve ser positivo');
        }

        // Arredondar para 2 casas decimais
        return parseFloat(valorNumerico.toFixed(2));
    }

    toString() {
        return this.valor.toFixed(2);
    }

    toFloat() {
        return this.valor;
    }

    formatarBRL() {
        return `R$ ${this.valor.toFixed(2).replace('.', ',')}`;
    }

    somar(outroValor) {
        if (outroValor instanceof ValorAposta) {
            return new ValorAposta(this.valor + outroValor.valor);
        }
        return new ValorAposta(this.valor + outroValor);
    }
}

module.exports = ValorAposta;
