/**
 * Value Object: Email
 * Representa e valida um endereço de e-mail
 * 
 * Regras de Negócio:
 * - Formato válido de e-mail
 * - Não pode ser vazio
 */

class Email {
    constructor(valor) {
        this.valor = this._validar(valor);
    }

    _validar(valor) {
        if (!valor || typeof valor !== 'string') {
            throw new Error('E-mail é obrigatório');
        }

        const emailTrimmed = valor.trim().toLowerCase();

        if (emailTrimmed.length === 0) {
            throw new Error('E-mail não pode ser vazio');
        }

        // Regex simplificado para validação de e-mail
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(emailTrimmed)) {
            throw new Error('Formato de e-mail inválido');
        }

        return emailTrimmed;
    }

    toString() {
        return this.valor;
    }

    equals(outroEmail) {
        if (!(outroEmail instanceof Email)) {
            return false;
        }
        return this.valor === outroEmail.valor;
    }
}

module.exports = Email;
