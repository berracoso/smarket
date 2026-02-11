/**
 * Entity: Aposta
 * Representa uma aposta feita por um usuário em um evento
 * 
 * Regras de Negócio:
 * - Valor mínimo: R$ 1.00
 * - Vinculada a um evento e usuário
 * - Imutável após criação (não pode ser editada/excluída)
 */

const ValorAposta = require('../value-objects/ValorAposta');

class Aposta {
    constructor({ id, userId, eventoId, nome, time, valor, timestamp = null }) {
        this.id = id;
        this.userId = this._validarUserId(userId);
        this.eventoId = this._validarEventoId(eventoId);
        this.nome = this._validarNome(nome);
        this.time = this._validarTime(time);
        this.valor = valor instanceof ValorAposta ? valor : new ValorAposta(valor);
        this.timestamp = timestamp || new Date().toISOString();
    }

    _validarUserId(userId) {
        if (!userId) {
            throw new Error('userId é obrigatório');
        }
        return userId;
    }

    _validarEventoId(eventoId) {
        if (!eventoId) {
            throw new Error('eventoId é obrigatório');
        }
        return eventoId;
    }

    _validarNome(nome) {
        if (!nome || typeof nome !== 'string') {
            throw new Error('Nome do apostador é obrigatório');
        }
        return nome.trim();
    }

    _validarTime(time) {
        if (!time || typeof time !== 'string') {
            throw new Error('Time é obrigatório');
        }
        return time.trim();
    }

    pertenceAoUsuario(userId) {
        return this.userId === userId;
    }

    pertenceAoEvento(eventoId) {
        return this.eventoId === eventoId;
    }

    getValorNumerico() {
        return this.valor.toFloat();
    }

    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            eventoId: this.eventoId,
            nome: this.nome,
            time: this.time,
            valor: this.valor.toFloat(),
            timestamp: this.timestamp
        };
    }
}

module.exports = Aposta;
