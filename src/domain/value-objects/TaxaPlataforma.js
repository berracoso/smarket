/**
 * Value Object: TaxaPlataforma
 * Representa a taxa cobrada pela plataforma nas apostas
 * 
 * Regras de Negócio:
 * - Taxa padrão: 5% (0.05)
 * - Usada para calcular o prêmio líquido
 */

class TaxaPlataforma {
    constructor(percentual = 0.05) {
        this.percentual = this._validar(percentual);
    }

    _validar(percentual) {
        if (typeof percentual !== 'number') {
            throw new Error('Taxa deve ser um número');
        }

        if (percentual < 0 || percentual >= 1) {
            throw new Error('Taxa deve estar entre 0 e 1 (0% a 100%)');
        }

        return percentual;
    }

    calcularTaxa(valorTotal) {
        return valorTotal * this.percentual;
    }

    calcularPremioLiquido(valorTotal) {
        return valorTotal * (1 - this.percentual);
    }

    get percentualFormatado() {
        return `${(this.percentual * 100).toFixed(0)}%`;
    }

    toFloat() {
        return this.percentual;
    }
}

module.exports = TaxaPlataforma;
