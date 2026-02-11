const PromoverUsuario = require('../../../../../src/application/use-cases/usuarios/PromoverUsuario');
const Usuario = require('../../../../../src/domain/entities/Usuario');
const Email = require('../../../../../src/domain/value-objects/Email');

describe('PromoverUsuario Use Case', () => {
    let promoverUsuario;
    let mockUsuarioRepository;

    beforeEach(() => {
        mockUsuarioRepository = {
            buscarPorId: jest.fn(),
            atualizar: jest.fn()
        };
        promoverUsuario = new PromoverUsuario(mockUsuarioRepository);
    });

    it('deve promover usuário comum para admin com sucesso', async () => {
        // Arrange
        const usuarioMock = new Usuario({
            id: 2,
            nome: 'User',
            email: new Email('user@teste.com'),
            senha: 'hash',
            isAdmin: false,
            tipo: 'usuario'
        });

        mockUsuarioRepository.buscarPorId.mockResolvedValue(usuarioMock);
        mockUsuarioRepository.atualizar.mockResolvedValue(true);

        // Act
        const resultado = await promoverUsuario.executar({ userId: 2 });

        // Assert
        expect(resultado.sucesso).toBe(true);
        expect(resultado.mensagem).toContain('promovido para Admin');
        
        // Verificar se chamou atualizar com os dados corretos
        expect(mockUsuarioRepository.atualizar).toHaveBeenCalledTimes(1);
        const usuarioAtualizado = mockUsuarioRepository.atualizar.mock.calls[0][0];
        expect(usuarioAtualizado.isAdmin).toBe(true);
        expect(usuarioAtualizado.tipo).toBe('admin');
        expect(usuarioAtualizado.papel).toBe('admin');
    });

    it('deve retornar erro se usuário não encontrado', async () => {
        // Arrange
        mockUsuarioRepository.buscarPorId.mockResolvedValue(null);

        // Act
        const resultado = await promoverUsuario.executar({ userId: 999 });

        // Assert
        expect(resultado.sucesso).toBe(false);
        expect(resultado.erro).toBe('Usuário não encontrado');
        expect(mockUsuarioRepository.atualizar).not.toHaveBeenCalled();
    });

    it('deve impedir promoção de Super Admin (embora já seja admin)', async () => {
        // Arrange
        const superAdmin = new Usuario({
            id: 1,
            nome: 'Super Admin',
            email: new Email('admin@teste.com'),
            senha: 'hash',
            isSuperAdmin: true,
            isAdmin: true,
            tipo: 'superadmin'
        });

        mockUsuarioRepository.buscarPorId.mockResolvedValue(superAdmin);

        // Act
        const resultado = await promoverUsuario.executar({ userId: 1 });

        // Assert
        expect(resultado.sucesso).toBe(false);
        expect(resultado.erro).toBe('Não é possível alterar nível de um Super Admin');
        expect(mockUsuarioRepository.atualizar).not.toHaveBeenCalled();
    });

    it('deve retornar erro genérico se repositório falhar', async () => {
        // Arrange
        const usuarioMock = new Usuario({
            id: 2,
            nome: 'User',
            email: new Email('user@teste.com'),
            senha: 'hash',
            isAdmin: false,
            tipo: 'usuario'
        });

        mockUsuarioRepository.buscarPorId.mockResolvedValue(usuarioMock);
        mockUsuarioRepository.atualizar.mockRejectedValue(new Error('Erro banco'));

        // Act
        const resultado = await promoverUsuario.executar({ userId: 2 });

        // Assert
        expect(resultado.sucesso).toBe(false);
        expect(resultado.erro).toBe('Falha ao promover usuário');
    });
});
