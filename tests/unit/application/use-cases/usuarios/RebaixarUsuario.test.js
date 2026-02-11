const RebaixarUsuario = require('../../../../../src/application/use-cases/usuarios/RebaixarUsuario');
const Usuario = require('../../../../../src/domain/entities/Usuario');
const Email = require('../../../../../src/domain/value-objects/Email');

describe('RebaixarUsuario Use Case', () => {
    let rebaixarUsuario;
    let mockUsuarioRepository;

    beforeEach(() => {
        mockUsuarioRepository = {
            buscarPorId: jest.fn(),
            atualizar: jest.fn()
        };
        rebaixarUsuario = new RebaixarUsuario(mockUsuarioRepository);
    });

    it('deve rebaixar admin para usuário comum com sucesso', async () => {
        // Arrange
        const adminMock = new Usuario({
            id: 2,
            nome: 'Admin Secundário',
            email: new Email('admin2@teste.com'),
            senha: 'hash',
            isAdmin: true,
            tipo: 'admin'
        });

        mockUsuarioRepository.buscarPorId.mockResolvedValue(adminMock);
        mockUsuarioRepository.atualizar.mockResolvedValue(true);

        // Act
        const resultado = await rebaixarUsuario.executar({ userId: 2 });

        // Assert
        expect(resultado.sucesso).toBe(true);
        expect(resultado.mensagem).toContain('rebaixado para Usuário comum');
        
        expect(mockUsuarioRepository.atualizar).toHaveBeenCalledTimes(1);
        const usuarioAtualizado = mockUsuarioRepository.atualizar.mock.calls[0][0];
        expect(usuarioAtualizado.isAdmin).toBe(false);
        expect(usuarioAtualizado.tipo).toBe('usuario');
        expect(usuarioAtualizado.papel).toBe('usuario');
    });

    it('deve retornar erro se usuário não encontrado', async () => {
        // Arrange
        mockUsuarioRepository.buscarPorId.mockResolvedValue(null);

        // Act
        const resultado = await rebaixarUsuario.executar({ userId: 999 });

        // Assert
        expect(resultado.sucesso).toBe(false);
        expect(resultado.erro).toBe('Usuário não encontrado');
    });

    it('deve impedir rebaixamento de Super Admin', async () => {
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
        const resultado = await rebaixarUsuario.executar({ userId: 1 });

        // Assert
        expect(resultado.sucesso).toBe(false);
        expect(resultado.erro).toBe('Não é possível rebaixar um Super Admin');
        expect(mockUsuarioRepository.atualizar).not.toHaveBeenCalled();
    });

    it('deve retornar erro genérico se repositório falhar', async () => {
        // Arrange
        const adminMock = new Usuario({
            id: 2,
            nome: 'Admin',
            email: new Email('admin@teste.com'),
            senha: 'hash',
            isAdmin: true,
            tipo: 'admin'
        });

        mockUsuarioRepository.buscarPorId.mockResolvedValue(adminMock);
        mockUsuarioRepository.atualizar.mockRejectedValue(new Error('Erro banco'));

        // Act
        const resultado = await rebaixarUsuario.executar({ userId: 2 });

        // Assert
        expect(resultado.sucesso).toBe(false);
        expect(resultado.erro).toBe('Falha ao rebaixar usuário');
    });
});
