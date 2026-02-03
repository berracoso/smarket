const ListarUsuarios = require('../../../../../src/application/use-cases/usuarios/ListarUsuarios');
const Usuario = require('../../../../../src/domain/entities/Usuario');
const Email = require('../../../../../src/domain/value-objects/Email');

describe('ListarUsuarios Use Case', () => {
    let listarUsuarios;
    let mockUsuarioRepository;

    beforeEach(() => {
        mockUsuarioRepository = {
            listarTodos: jest.fn()
        };
        listarUsuarios = new ListarUsuarios(mockUsuarioRepository);
    });

    it('deve retornar lista de usuários (DTOs) com sucesso', async () => {
        // Arrange
        const usuariosMock = [
            new Usuario({
                id: 1,
                nome: 'Admin',
                email: new Email('admin@teste.com'),
                senha: 'hash',
                isAdmin: true,
                tipo: 'admin'
            }),
            new Usuario({
                id: 2,
                nome: 'User',
                email: new Email('user@teste.com'),
                senha: 'hash',
                isAdmin: false,
                tipo: 'usuario'
            })
        ];
        
        mockUsuarioRepository.listarTodos.mockResolvedValue(usuariosMock);

        // Act
        const resultado = await listarUsuarios.executar();

        // Assert
        expect(resultado.sucesso).toBe(true);
        expect(resultado.usuarios).toHaveLength(2);
        
        // Verificar DTO (não deve ter senha)
        expect(resultado.usuarios[0]).not.toHaveProperty('senha');
        expect(resultado.usuarios[0]).toHaveProperty('email', 'admin@teste.com');
        expect(resultado.usuarios[0]).toHaveProperty('papel', 'admin');
        
        expect(mockUsuarioRepository.listarTodos).toHaveBeenCalledTimes(1);
    });

    it('deve retornar erro quando repositório falhar', async () => {
        // Arrange
        mockUsuarioRepository.listarTodos.mockRejectedValue(new Error('Erro banco'));

        // Act
        const resultado = await listarUsuarios.executar();

        // Assert
        expect(resultado.sucesso).toBe(false);
        expect(resultado.erro).toBe('Falha ao listar usuários');
    });
});
