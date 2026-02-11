/**
 * Use Case: Registrar Novo Usuário
 * 
 * Orquestra o processo de registro de um novo usuário:
 * 1. Valida os dados de entrada (Email e Senha via Value Objects)
 * 2. Verifica se o email já está em uso
 * 3. Gera hash da senha
 * 4. Cria a entidade Usuario
 * 5. Persiste no banco via Repository
 * 6. Retorna DTO com dados do usuário criado
 */

const Usuario = require('../../../domain/entities/Usuario');
const Email = require('../../../domain/value-objects/Email');
const Senha = require('../../../domain/value-objects/Senha');

class RegistrarUsuario {
    constructor(usuarioRepository, bcryptHasher) {
        this.usuarioRepository = usuarioRepository;
        this.bcryptHasher = bcryptHasher;
    }

    /**
     * Executa o caso de uso
     * @param {Object} dados - { nome, email, senha }
     * @returns {Promise<Object>} { sucesso: true, usuario: {...} }
     */
    async executar({ nome, email, senha }) {
        // 1. Validar entrada via Value Objects
        const emailObj = new Email(email);
        const senhaObj = new Senha(senha);

        // 2. Verificar se email já existe
        const usuarioExistente = await this.usuarioRepository.buscarPorEmail(emailObj.toString());
        if (usuarioExistente) {
            throw new Error('Email já cadastrado');
        }

        // 3. Hash da senha
        const senhaHash = await this.bcryptHasher.hash(senhaObj.toString());

        // 4. Criar entidade Usuario
        const usuario = new Usuario({
            nome,
            email: emailObj,
            senha: senhaHash
        });

        // 5. Persistir
        const userId = await this.usuarioRepository.criar(usuario);

        // 6. Retornar DTO (sem senha)
        return {
            sucesso: true,
            usuario: {
                id: userId,
                nome: usuario.nome,
                email: usuario.email.toString(),
                tipo: usuario.tipo,
                isAdmin: usuario.isAdmin,
                isSuperAdmin: usuario.isSuperAdmin
            }
        };
    }
}

module.exports = RegistrarUsuario;
