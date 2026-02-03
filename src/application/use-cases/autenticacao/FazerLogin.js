/**
 * Use Case: Fazer Login
 * 
 * Orquestra o processo de autenticação:
 * 1. Valida email
 * 2. Busca usuário no banco
 * 3. Compara senha fornecida com hash armazenado
 * 4. Retorna dados do usuário autenticado
 */

const Email = require('../../../domain/value-objects/Email');

class FazerLogin {
    constructor(usuarioRepository, bcryptHasher) {
        this.usuarioRepository = usuarioRepository;
        this.bcryptHasher = bcryptHasher;
    }

    /**
     * Executa o caso de uso
     * @param {Object} dados - { email, senha }
     * @returns {Promise<Object>} { sucesso: true, usuario: {...} }
     */
    async executar({ email, senha }) {
        // 1. Validar email
        const emailObj = new Email(email);

        // 2. Buscar usuário
        const usuario = await this.usuarioRepository.buscarPorEmail(emailObj.toString());
        if (!usuario) {
            throw new Error('Credenciais inválidas');
        }

        // 3. Validar senha
        const senhaValida = await this.bcryptHasher.compare(senha, usuario.senha);
        if (!senhaValida) {
            throw new Error('Credenciais inválidas');
        }

        // 4. Retornar dados do usuário (sem senha)
        return {
            sucesso: true,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email.toString(),
                tipo: usuario.tipo,
                isAdmin: usuario.isAdmin,
                isSuperAdmin: usuario.isSuperAdmin
            }
        };
    }
}

module.exports = FazerLogin;
