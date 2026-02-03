/**
 * Testes Unitários - RegistrarUsuario Use Case
 * Mocka repositories e testa a orquestração da lógica
 */

const RegistrarUsuario = require('../../../../../src/application/use-cases/autenticacao/RegistrarUsuario');
const Usuario = require('../../../../../src/domain/entities/Usuario');
const Email = require('../../../../../src/domain/value-objects/Email');

describe('Use Case: RegistrarUsuario', () => {
    let useCase;
    let mockUsuarioRepository;
    let mockBcryptHasher;

    beforeEach(() => {
        // Mock do repository
        mockUsuarioRepository = {
            buscarPorEmail: jest.fn(),
            criar: jest.fn()
        };

        // Mock do hasher
        mockBcryptHasher = {
            hash: jest.fn()
        };

        useCase = new RegistrarUsuario(mockUsuarioRepository, mockBcryptHasher);
    });

    describe('Sucesso', () => {
        test('Deve registrar novo usuário com sucesso', async () => {
            // Arrange
            mockUsuarioRepository.buscarPorEmail.mockResolvedValue(null);
            mockBcryptHasher.hash.mockResolvedValue('$2b$10$hashedpassword');
            mockUsuarioRepository.criar.mockResolvedValue(1);

            // Act
            const resultado = await useCase.executar({
                nome: 'João Silva',
                email: 'joao@teste.com',
                senha: 'senha123'
            });

            // Assert
            expect(resultado.sucesso).toBe(true);
            expect(resultado.usuario.id).toBe(1);
            expect(resultado.usuario.nome).toBe('João Silva');
            expect(resultado.usuario.email).toBe('joao@teste.com');
            expect(resultado.usuario.tipo).toBe('usuario');
            expect(mockUsuarioRepository.buscarPorEmail).toHaveBeenCalledWith('joao@teste.com');
            expect(mockBcryptHasher.hash).toHaveBeenCalledWith('senha123');
            expect(mockUsuarioRepository.criar).toHaveBeenCalled();
        });

        test('Deve normalizar email para minúsculas', async () => {
            mockUsuarioRepository.buscarPorEmail.mockResolvedValue(null);
            mockBcryptHasher.hash.mockResolvedValue('$2b$10$hashedpassword');
            mockUsuarioRepository.criar.mockResolvedValue(1);

            const resultado = await useCase.executar({
                nome: 'Maria Santos',
                email: 'MARIA@TESTE.COM',
                senha: 'senha456'
            });

            expect(resultado.usuario.email).toBe('maria@teste.com');
            expect(mockUsuarioRepository.buscarPorEmail).toHaveBeenCalledWith('maria@teste.com');
        });
    });

    describe('Validações', () => {
        test('Deve rejeitar email já cadastrado', async () => {
            // Simula usuário existente
            mockUsuarioRepository.buscarPorEmail.mockResolvedValue(
                new Usuario({ nome: 'Existente', email: 'joao@teste.com', senha: 'hash' })
            );

            await expect(useCase.executar({
                nome: 'João Silva',
                email: 'joao@teste.com',
                senha: 'senha123'
            })).rejects.toThrow('Email já cadastrado');

            expect(mockBcryptHasher.hash).not.toHaveBeenCalled();
            expect(mockUsuarioRepository.criar).not.toHaveBeenCalled();
        });

        test('Deve rejeitar email inválido', async () => {
            await expect(useCase.executar({
                nome: 'João Silva',
                email: 'emailinvalido',
                senha: 'senha123'
            })).rejects.toThrow('Formato de e-mail inválido');
        });

        test('Deve rejeitar senha menor que 6 caracteres', async () => {
            await expect(useCase.executar({
                nome: 'João Silva',
                email: 'joao@teste.com',
                senha: '12345'
            })).rejects.toThrow('Senha deve ter no mínimo 6 caracteres');
        });

        test('Deve rejeitar nome vazio', async () => {
            await expect(useCase.executar({
                nome: '',
                email: 'joao@teste.com',
                senha: 'senha123'
            })).rejects.toThrow('Nome é obrigatório');
        });

        test('Deve rejeitar nome com menos de 3 caracteres', async () => {
            await expect(useCase.executar({
                nome: 'Jo',
                email: 'joao@teste.com',
                senha: 'senha123'
            })).rejects.toThrow('Nome deve ter no mínimo 3 caracteres');
        });
    });

    describe('Integração com Domain Layer', () => {
        test('Deve usar Value Objects para validação', async () => {
            mockUsuarioRepository.buscarPorEmail.mockResolvedValue(null);
            mockBcryptHasher.hash.mockResolvedValue('$2b$10$hashedpassword');
            mockUsuarioRepository.criar.mockResolvedValue(1);

            await useCase.executar({
                nome: 'Teste',
                email: 'teste@teste.com',
                senha: 'senha123'
            });

            // Verifica que o email foi processado pelo Value Object Email
            expect(mockUsuarioRepository.buscarPorEmail).toHaveBeenCalledWith('teste@teste.com');
        });

        test('Deve criar entidade Usuario antes de persistir', async () => {
            mockUsuarioRepository.buscarPorEmail.mockResolvedValue(null);
            mockBcryptHasher.hash.mockResolvedValue('$2b$10$hashedpassword');
            mockUsuarioRepository.criar.mockResolvedValue(1);

            await useCase.executar({
                nome: 'Teste',
                email: 'teste@teste.com',
                senha: 'senha123'
            });

            const callArg = mockUsuarioRepository.criar.mock.calls[0][0];
            expect(callArg).toBeInstanceOf(Usuario);
            expect(callArg.nome).toBe('Teste');
        });
    });
});
