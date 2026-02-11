/**
 * Value Object: Senha
 * Representa e valida uma senha
 * 
 * Regras de Negócio:
 * - Mínimo de 6 caracteres
 * - Não pode ser vazia
 */

class Senha {
    constructor(valor) {
        this.valor = this._validar(valor);
    }

    _validar(valor) {
        if (!valor || typeof valor !== 'string') {
            throw new Error('Senha é obrigatória');
        }

        if (valor.length < 6) {
            throw new Error('Senha deve ter no mínimo 6 caracteres');
        }

        return valor;
    }

    toString() {
        return this.valor;
    }

    get tamanho() {
        return this.valor.length;
    }
}

module.exports = Senha;
