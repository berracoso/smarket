/**
 * Interface: IUsuarioRepository
 * Define o contrato para persistência de usuários
 * 
 * Padrão: Repository Pattern
 * Implementações concretas: SQLiteUsuarioRepository, MongoUsuarioRepository, etc.
 */

class IUsuarioRepository {
    async buscarPorId(id) {
        throw new Error('Método buscarPorId() deve ser implementado');
    }

    async buscarPorEmail(email) {
        throw new Error('Método buscarPorEmail() deve ser implementado');
    }

    async listarTodos() {
        throw new Error('Método listarTodos() deve ser implementado');
    }

    async criar(usuario) {
        throw new Error('Método criar() deve ser implementado');
    }

    async atualizar(id, dadosAtualizados) {
        throw new Error('Método atualizar() deve ser implementado');
    }

    async excluir(id) {
        throw new Error('Método excluir() deve ser implementado');
    }

    async promoverParaAdmin(id) {
        throw new Error('Método promoverParaAdmin() deve ser implementado');
    }

    async rebaixarParaUsuario(id) {
        throw new Error('Método rebaixarParaUsuario() deve ser implementado');
    }
}

module.exports = IUsuarioRepository;
