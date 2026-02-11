/**
 * Use Case: Obter Usuário Atual
 * 
 * Busca dados completos do usuário autenticado pelo ID.
 */

class ObterUsuarioAtual {
    constructor(usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    /**
     * Executa o caso de uso
     * @param {number} userId 
     * @returns {Promise<Object>} { sucesso: true, usuario: {...} }
     */
    async executar(userId) {
        if (!userId) {
            throw new Error('Usuário não autenticado');
        }

        const usuario = await this.usuarioRepository.buscarPorId(userId);
        if (!usuario) {
            throw new Error('Usuário não encontrado');
        }

        return {
            sucesso: true,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email.toString(),
                tipo: usuario.tipo,
                isAdmin: usuario.isAdmin,
                isSuperAdmin: usuario.isSuperAdmin,
                criadoEm: usuario.criadoEm
            }
        };
    }
}

module.exports = ObterUsuarioAtual;
