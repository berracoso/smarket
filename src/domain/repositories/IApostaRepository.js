/**
 * Interface: IApostaRepository
 * Define o contrato para persistência de apostas
 * 
 * Padrão: Repository Pattern
 */

class IApostaRepository {
    async buscarPorId(id) {
        throw new Error('Método buscarPorId() deve ser implementado');
    }

    async listarPorUsuario(userId, filtros = {}) {
        throw new Error('Método listarPorUsuario() deve ser implementado');
    }

    async listarPorEvento(eventoId) {
        throw new Error('Método listarPorEvento() deve ser implementado');
    }

    async listarPorUsuarioEEvento(userId, eventoId) {
        throw new Error('Método listarPorUsuarioEEvento() deve ser implementado');
    }

    async criar(aposta) {
        throw new Error('Método criar() deve ser implementado');
    }

    async contarPorUsuario(userId) {
        throw new Error('Método contarPorUsuario() deve ser implementado');
    }

    async calcularTotalPorUsuario(userId) {
        throw new Error('Método calcularTotalPorUsuario() deve ser implementado');
    }
}

module.exports = IApostaRepository;
