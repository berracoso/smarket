/**
 * Interface: IEventoRepository
 * Define o contrato para persistência de eventos
 * 
 * Padrão: Repository Pattern
 */

class IEventoRepository {
    async buscarPorId(id) {
        throw new Error('Método buscarPorId() deve ser implementado');
    }

    async buscarPorCodigo(codigo) {
        throw new Error('Método buscarPorCodigo() deve ser implementado');
    }

    async buscarEventoAtivo() {
        throw new Error('Método buscarEventoAtivo() deve ser implementado');
    }

    async listarTodos(filtros = {}) {
        throw new Error('Método listarTodos() deve ser implementado');
    }

    async criar(evento) {
        throw new Error('Método criar() deve ser implementado');
    }

    async atualizar(id, dadosAtualizados) {
        throw new Error('Método atualizar() deve ser implementado');
    }

    async abrirApostas(id) {
        throw new Error('Método abrirApostas() deve ser implementado');
    }

    async fecharApostas(id) {
        throw new Error('Método fecharApostas() deve ser implementado');
    }

    async definirVencedor(id, vencedor) {
        throw new Error('Método definirVencedor() deve ser implementado');
    }

    async arquivar(id) {
        throw new Error('Método arquivar() deve ser implementado');
    }
}

module.exports = IEventoRepository;
