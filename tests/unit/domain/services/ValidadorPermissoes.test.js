/**
 * Testes Unitários: ValidadorPermissoes Domain Service
 */

const ValidadorPermissoes = require('../../../../src/domain/services/ValidadorPermissoes');

describe('Domain Service: ValidadorPermissoes', () => {
    let validador;
    
    beforeEach(() => {
        validador = new ValidadorPermissoes();
    });

    describe('Permissão para Apostar', () => {
        test('Usuário comum pode apostar', () => {
            const usuario = {
                id: 1,
                isSuperAdmin: false,
                isAdmin: false
            };
            
            expect(validador.podeApostar(usuario)).toBe(true);
        });

        test('Admin pode apostar', () => {
            const admin = {
                id: 2,
                isAdmin: true,
                isSuperAdmin: false
            };
            
            expect(validador.podeApostar(admin)).toBe(true);
        });

        test('Super Admin NÃO pode apostar', () => {
            const superAdmin = {
                id: 3,
                isSuperAdmin: true,
                isAdmin: false
            };
            
            expect(validador.podeApostar(superAdmin)).toBe(false);
        });
    });

    describe('Permissão para Gerenciar Eventos', () => {
        test('Usuário comum NÃO pode gerenciar eventos', () => {
            const usuario = {
                isAdmin: false,
                isSuperAdmin: false
            };
            
            expect(validador.podeGerenciarEventos(usuario)).toBe(false);
        });

        test('Admin pode gerenciar eventos', () => {
            const admin = {
                isAdmin: true,
                isSuperAdmin: false
            };
            
            expect(validador.podeGerenciarEventos(admin)).toBe(true);
        });

        test('Super Admin pode gerenciar eventos', () => {
            const superAdmin = {
                isAdmin: false,
                isSuperAdmin: true
            };
            
            expect(validador.podeGerenciarEventos(superAdmin)).toBe(true);
        });
    });

    describe('Permissão para Gerenciar Usuários', () => {
        test('Usuário comum NÃO pode gerenciar usuários', () => {
            const usuario = {
                isSuperAdmin: false
            };
            
            expect(validador.podeGerenciarUsuarios(usuario)).toBe(false);
        });

        test('Admin NÃO pode gerenciar usuários', () => {
            const admin = {
                isAdmin: true,
                isSuperAdmin: false
            };
            
            expect(validador.podeGerenciarUsuarios(admin)).toBe(false);
        });

        test('Apenas Super Admin pode gerenciar usuários', () => {
            const superAdmin = {
                isSuperAdmin: true
            };
            
            expect(validador.podeGerenciarUsuarios(superAdmin)).toBe(true);
        });
    });

    describe('Promoção de Usuário', () => {
        test('Super Admin pode promover usuário comum', () => {
            const superAdmin = { id: 1, isSuperAdmin: true };
            const usuario = { id: 2, isSuperAdmin: false };
            
            expect(validador.podePromoverUsuario(superAdmin, usuario)).toBe(true);
        });

        test('Admin NÃO pode promover usuário', () => {
            const admin = { id: 1, isAdmin: true, isSuperAdmin: false };
            const usuario = { id: 2, isSuperAdmin: false };
            
            expect(() => validador.podePromoverUsuario(admin, usuario))
                .toThrow('Apenas Super Admin pode promover usuários');
        });

        test('NÃO pode promover Super Admin', () => {
            const superAdmin1 = { id: 1, isSuperAdmin: true };
            const superAdmin2 = { id: 2, isSuperAdmin: true };
            
            expect(() => validador.podePromoverUsuario(superAdmin1, superAdmin2))
                .toThrow('Super Admin não pode ser promovido');
        });
    });

    describe('Rebaixamento de Usuário', () => {
        test('Super Admin pode rebaixar admin', () => {
            const superAdmin = { id: 1, isSuperAdmin: true };
            const admin = { id: 2, isAdmin: true, isSuperAdmin: false };
            
            expect(validador.podeRebaixarUsuario(superAdmin, admin)).toBe(true);
        });

        test('Admin NÃO pode rebaixar usuário', () => {
            const admin = { id: 1, isAdmin: true, isSuperAdmin: false };
            const outroAdmin = { id: 2, isAdmin: true, isSuperAdmin: false };
            
            expect(() => validador.podeRebaixarUsuario(admin, outroAdmin))
                .toThrow('Apenas Super Admin pode rebaixar usuários');
        });

        test('NÃO pode rebaixar Super Admin', () => {
            const superAdmin1 = { id: 1, isSuperAdmin: true };
            const superAdmin2 = { id: 2, isSuperAdmin: true };
            
            expect(() => validador.podeRebaixarUsuario(superAdmin1, superAdmin2))
                .toThrow('Super Admin não pode ser rebaixado');
        });
    });

    describe('Exclusão de Usuário', () => {
        test('Super Admin pode excluir usuário comum', () => {
            const superAdmin = { id: 1, isSuperAdmin: true };
            const usuario = { id: 2, isSuperAdmin: false };
            
            expect(validador.podeExcluirUsuario(superAdmin, usuario)).toBe(true);
        });

        test('Admin NÃO pode excluir usuário', () => {
            const admin = { id: 1, isAdmin: true, isSuperAdmin: false };
            const usuario = { id: 2, isSuperAdmin: false };
            
            expect(() => validador.podeExcluirUsuario(admin, usuario))
                .toThrow('Apenas Super Admin pode excluir usuários');
        });

        test('NÃO pode excluir Super Admin', () => {
            const superAdmin1 = { id: 1, isSuperAdmin: true };
            const superAdmin2 = { id: 2, isSuperAdmin: true };
            
            expect(() => validador.podeExcluirUsuario(superAdmin1, superAdmin2))
                .toThrow('Super Admin não pode ser excluído');
        });

        test('NÃO pode se auto-excluir', () => {
            const superAdmin = { id: 1, isSuperAdmin: true };
            
            expect(() => validador.podeExcluirUsuario(superAdmin, superAdmin))
                .toThrow('Super Admin não pode ser excluído');
        });
    });

    describe('Validação de Ação em Evento', () => {
        test('Admin pode executar ações válidas em evento', () => {
            const admin = { isAdmin: true, isSuperAdmin: false };
            
            expect(validador.validarAcaoEvento(admin, 'abrir')).toBe(true);
            expect(validador.validarAcaoEvento(admin, 'fechar')).toBe(true);
            expect(validador.validarAcaoEvento(admin, 'definir_vencedor')).toBe(true);
            expect(validador.validarAcaoEvento(admin, 'resetar')).toBe(true);
            expect(validador.validarAcaoEvento(admin, 'criar')).toBe(true);
        });

        test('Usuário comum NÃO pode executar ações em evento', () => {
            const usuario = { isAdmin: false, isSuperAdmin: false };
            
            expect(() => validador.validarAcaoEvento(usuario, 'abrir'))
                .toThrow('Usuário não tem permissão para gerenciar eventos');
        });

        test('Deve rejeitar ação inválida', () => {
            const admin = { isAdmin: true, isSuperAdmin: false };
            
            expect(() => validador.validarAcaoEvento(admin, 'acao_invalida'))
                .toThrow('Ação inválida: acao_invalida');
        });
    });
});
