/**
 * Testes Unitários: Usuario Entity
 */

const Usuario = require('../../../../src/domain/entities/Usuario');
const Email = require('../../../../src/domain/value-objects/Email');

describe('Entity: Usuario', () => {
    describe('Criação e Validações', () => {
        test('Deve criar usuário comum válido', () => {
            const usuario = new Usuario({
                id: 1,
                nome: 'João Silva',
                email: 'joao@teste.com',
                senha: 'senha123'
            });

            expect(usuario.id).toBe(1);
            expect(usuario.nome).toBe('João Silva');
            expect(usuario.email.toString()).toBe('joao@teste.com');
            expect(usuario.tipo).toBe('usuario');
            expect(usuario.isAdmin).toBe(false);
            expect(usuario.isSuperAdmin).toBe(false);
        });

        test('Deve criar admin válido', () => {
            const usuario = new Usuario({
                id: 2,
                nome: 'Maria Admin',
                email: 'maria@teste.com',
                senha: 'senha123',
                isAdmin: true
            });

            expect(usuario.tipo).toBe('admin');
            expect(usuario.isAdmin).toBe(true);
            expect(usuario.isSuperAdmin).toBe(false);
        });

        test('Deve criar super admin válido', () => {
            const usuario = new Usuario({
                id: 3,
                nome: 'Super Admin',
                email: 'super@teste.com',
                senha: 'senha123',
                isSuperAdmin: true
            });

            expect(usuario.tipo).toBe('superadmin');
            expect(usuario.isAdmin).toBe(false);
            expect(usuario.isSuperAdmin).toBe(true);
        });

        test('Deve aceitar objeto Email como email', () => {
            const email = new Email('teste@teste.com');
            const usuario = new Usuario({
                id: 4,
                nome: 'Teste',
                email: email,
                senha: 'senha123'
            });

            expect(usuario.email).toBe(email);
        });

        test('Deve rejeitar nome vazio', () => {
            expect(() => new Usuario({
                id: 5,
                nome: '',
                email: 'teste@teste.com',
                senha: 'senha123'
            })).toThrow('Nome é obrigatório');
        });

        test('Deve rejeitar nome com menos de 3 caracteres', () => {
            expect(() => new Usuario({
                id: 6,
                nome: 'Jo',
                email: 'teste@teste.com',
                senha: 'senha123'
            })).toThrow('Nome deve ter no mínimo 3 caracteres');
        });

        test('Deve remover espaços do nome', () => {
            const usuario = new Usuario({
                id: 7,
                nome: '  João Silva  ',
                email: 'joao@teste.com',
                senha: 'senha123'
            });

            expect(usuario.nome).toBe('João Silva');
        });
    });

    describe('Permissões', () => {
        test('Usuário comum pode apostar', () => {
            const usuario = new Usuario({
                id: 1,
                nome: 'Usuário',
                email: 'user@teste.com',
                senha: 'senha123'
            });

            expect(usuario.podeApostar()).toBe(true);
        });

        test('Admin pode apostar', () => {
            const admin = new Usuario({
                id: 2,
                nome: 'Admin',
                email: 'admin@teste.com',
                senha: 'senha123',
                isAdmin: true
            });

            expect(admin.podeApostar()).toBe(true);
        });

        test('Super Admin NÃO pode apostar', () => {
            const superAdmin = new Usuario({
                id: 3,
                nome: 'Super',
                email: 'super@teste.com',
                senha: 'senha123',
                isSuperAdmin: true
            });

            expect(superAdmin.podeApostar()).toBe(false);
        });

        test('Usuário comum NÃO pode gerenciar eventos', () => {
            const usuario = new Usuario({
                id: 1,
                nome: 'Usuário',
                email: 'user@teste.com',
                senha: 'senha123'
            });

            expect(usuario.podeGerenciarEventos()).toBe(false);
        });

        test('Admin pode gerenciar eventos', () => {
            const admin = new Usuario({
                id: 2,
                nome: 'Admin',
                email: 'admin@teste.com',
                senha: 'senha123',
                isAdmin: true
            });

            expect(admin.podeGerenciarEventos()).toBe(true);
        });

        test('Super Admin pode gerenciar eventos', () => {
            const superAdmin = new Usuario({
                id: 3,
                nome: 'Super',
                email: 'super@teste.com',
                senha: 'senha123',
                isSuperAdmin: true
            });

            expect(superAdmin.podeGerenciarEventos()).toBe(true);
        });

        test('Apenas Super Admin pode gerenciar usuários', () => {
            const usuario = new Usuario({
                id: 1,
                nome: 'Usuário',
                email: 'user@teste.com',
                senha: 'senha123'
            });

            const admin = new Usuario({
                id: 2,
                nome: 'Admin',
                email: 'admin@teste.com',
                senha: 'senha123',
                isAdmin: true
            });

            const superAdmin = new Usuario({
                id: 3,
                nome: 'Super',
                email: 'super@teste.com',
                senha: 'senha123',
                isSuperAdmin: true
            });

            expect(usuario.podeGerenciarUsuarios()).toBe(false);
            expect(admin.podeGerenciarUsuarios()).toBe(false);
            expect(superAdmin.podeGerenciarUsuarios()).toBe(true);
        });
    });

    describe('Promoção e Rebaixamento', () => {
        test('Deve promover usuário para admin', () => {
            const usuario = new Usuario({
                id: 1,
                nome: 'Usuário',
                email: 'user@teste.com',
                senha: 'senha123'
            });

            usuario.promoverParaAdmin();

            expect(usuario.isAdmin).toBe(true);
            expect(usuario.tipo).toBe('admin');
        });

        test('Deve rebaixar admin para usuário', () => {
            const admin = new Usuario({
                id: 2,
                nome: 'Admin',
                email: 'admin@teste.com',
                senha: 'senha123',
                isAdmin: true
            });

            admin.rebaixarParaUsuario();

            expect(admin.isAdmin).toBe(false);
            expect(admin.tipo).toBe('usuario');
        });

        test('NÃO deve promover Super Admin', () => {
            const superAdmin = new Usuario({
                id: 3,
                nome: 'Super',
                email: 'super@teste.com',
                senha: 'senha123',
                isSuperAdmin: true
            });

            expect(() => superAdmin.promoverParaAdmin()).toThrow('Super Admin não pode ser promovido');
        });

        test('NÃO deve rebaixar Super Admin', () => {
            const superAdmin = new Usuario({
                id: 3,
                nome: 'Super',
                email: 'super@teste.com',
                senha: 'senha123',
                isSuperAdmin: true
            });

            expect(() => superAdmin.rebaixarParaUsuario()).toThrow('Super Admin não pode ser rebaixado');
        });
    });

    describe('Serialização', () => {
        test('toJSON() deve retornar objeto serializado', () => {
            const usuario = new Usuario({
                id: 1,
                nome: 'João',
                email: 'joao@teste.com',
                senha: 'senha123'
            });

            const json = usuario.toJSON();

            expect(json).toEqual({
                id: 1,
                nome: 'João',
                email: 'joao@teste.com',
                isAdmin: false,
                isSuperAdmin: false,
                tipo: 'usuario',
                criadoEm: expect.any(String)
            });
        });
    });
});
