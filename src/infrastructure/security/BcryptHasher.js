/**
 * Serviço de hashing de senhas usando bcrypt
 * Encapsula a lógica de hash e comparação de senhas
 */

const bcrypt = require('bcryptjs');

class BcryptHasher {
    constructor(saltRounds = 10) {
        this.saltRounds = saltRounds;
    }

    /**
     * Gera hash de uma senha
     * @param {string} senha 
     * @returns {Promise<string>}
     */
    async hash(senha) {
        return await bcrypt.hash(senha, this.saltRounds);
    }

    /**
     * Compara senha em texto plano com hash
     * @param {string} senha 
     * @param {string} hash 
     * @returns {Promise<boolean>}
     */
    async compare(senha, hash) {
        return await bcrypt.compare(senha, hash);
    }

    /**
     * Valida força da senha (mínimo 6 caracteres)
     * @param {string} senha 
     * @returns {boolean}
     */
    validarForca(senha) {
        return senha && senha.length >= 6;
    }
}

module.exports = BcryptHasher;
