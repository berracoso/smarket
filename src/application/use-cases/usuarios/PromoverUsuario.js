/**
 * Use Case: Promover Usuário
 * Transforma um usuário comum em administrador
 */

class PromoverUsuario {
    constructor(usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    /**
     * Executa o caso de uso
     * @param {Object} params - { userId }
     * @returns {Promise<Object>} Resultado da operação
     */
    async executar({ userId }) {
        try {
            const usuario = await this.usuarioRepository.buscarPorId(userId);

            if (!usuario) {
                return {
                    sucesso: false,
                    erro: 'Usuário não encontrado'
                };
            }

            if (usuario.isSuperAdmin) {
                return {
                    sucesso: false,
                    erro: 'Não é possível alterar nível de um Super Admin'
                };
            }

            // Promover para admin
            usuario.papel = 'admin';
            // Atualizar entidade (setters devem tratar isAdmnin/tipo)
            // Como a entidade Usuario pode ter lógica complexa, vamos garantir que os flags sejam atualizados
            usuario.isAdmin = true;
            usuario.tipo = 'admin';

            await this.usuarioRepository.atualizar(usuario);

            return {
                sucesso: true,
                mensagem: `Usuário ${usuario.nome} promovido para Admin`
            };
        } catch (erro) {
            console.error('Erro ao promover usuário:', erro);
            return {
                sucesso: false,
                erro: 'Falha ao promover usuário'
            };
        }
    }
}

module.exports = PromoverUsuario;
