/**
 * Use Case: Rebaixar Usuário
 * Transforma um administrador em usuário comum
 */

class RebaixarUsuario {
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
                    erro: 'Não é possível rebaixar um Super Admin'
                };
            }

            // Rebaixar para usuário comum
            usuario.papel = 'usuario';
            usuario.isAdmin = false;
            usuario.tipo = 'usuario';

            await this.usuarioRepository.atualizar(usuario);

            return {
                sucesso: true,
                mensagem: `Usuário ${usuario.nome} rebaixado para Usuário comum`
            };
        } catch (erro) {
            console.error('Erro ao rebaixar usuário:', erro);
            return {
                sucesso: false,
                erro: 'Falha ao rebaixar usuário'
            };
        }
    }
}

module.exports = RebaixarUsuario;
