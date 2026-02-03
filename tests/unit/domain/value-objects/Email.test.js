/**
 * Testes Unitários: Email Value Object
 */

const Email = require('../../../../src/domain/value-objects/Email');

describe('Value Object: Email', () => {
    describe('Validações', () => {
        test('Deve criar email válido', () => {
            const email = new Email('usuario@exemplo.com');
            expect(email.toString()).toBe('usuario@exemplo.com');
        });

        test('Deve converter para minúsculas', () => {
            const email = new Email('USUARIO@EXEMPLO.COM');
            expect(email.toString()).toBe('usuario@exemplo.com');
        });

        test('Deve remover espaços em branco', () => {
            const email = new Email('  usuario@exemplo.com  ');
            expect(email.toString()).toBe('usuario@exemplo.com');
        });

        test('Deve rejeitar email vazio', () => {
            expect(() => new Email('')).toThrow('E-mail é obrigatório');
        });

        test('Deve rejeitar email null', () => {
            expect(() => new Email(null)).toThrow('E-mail é obrigatório');
        });

        test('Deve rejeitar email undefined', () => {
            expect(() => new Email(undefined)).toThrow('E-mail é obrigatório');
        });

        test('Deve rejeitar formato inválido (sem @)', () => {
            expect(() => new Email('usuarioexemplo.com')).toThrow('Formato de e-mail inválido');
        });

        test('Deve rejeitar formato inválido (sem domínio)', () => {
            expect(() => new Email('usuario@')).toThrow('Formato de e-mail inválido');
        });

        test('Deve rejeitar formato inválido (sem .com/.br/etc)', () => {
            expect(() => new Email('usuario@exemplo')).toThrow('Formato de e-mail inválido');
        });
    });

    describe('Métodos', () => {
        test('toString() deve retornar o valor do email', () => {
            const email = new Email('teste@teste.com');
            expect(email.toString()).toBe('teste@teste.com');
        });

        test('equals() deve comparar dois emails iguais', () => {
            const email1 = new Email('teste@teste.com');
            const email2 = new Email('teste@teste.com');
            expect(email1.equals(email2)).toBe(true);
        });

        test('equals() deve retornar false para emails diferentes', () => {
            const email1 = new Email('teste1@teste.com');
            const email2 = new Email('teste2@teste.com');
            expect(email1.equals(email2)).toBe(false);
        });

        test('equals() deve retornar false para não-Email', () => {
            const email = new Email('teste@teste.com');
            expect(email.equals('teste@teste.com')).toBe(false);
        });
    });
});
