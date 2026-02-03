/**
 * Use Case: Listar Usuários
 * Retorna lista de todos os usuários do sistema
 */

class ListarUsuarios {
    constructor(usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    /**
     * Executa o caso de uso
     * @returns {Promise<Object>} Resultado da operação
     */
    async executar() {
        try {
            const usuarios = await this.usuarioRepository.listarTodos();

            // Mapear para DTO (Data Transfer Object) para não expor senhas
            const usuariosDTO = usuarios.map(u => ({
                id: u.id,
                nome: u.nome,
                email: u.email.toString(),
                papel: u.tipo,
                isAdmin: u.isAdmin,
                isSuperAdmin: u.isSuperAdmin,
                criadoEm: u.criadoEm
            }));

            return {
                sucesso: true,
                usuarios: usuariosDTO
            };
        } catch (erro) {
            console.error('Erro ao listar usuários:', erro);
            return {
                sucesso: false,
                erro: 'Falha ao listar usuários'
            };
        }
    }
}

module.exports = ListarUsuarios;
