/**
 * Testes Unitários: Senha Value Object
 */

const Senha = require('../../../../src/domain/value-objects/Senha');

describe('Value Object: Senha', () => {
    describe('Validações', () => {
        test('Deve criar senha válida com 6 caracteres', () => {
            const senha = new Senha('123456');
            expect(senha.toString()).toBe('123456');
        });

        test('Deve criar senha válida com mais de 6 caracteres', () => {
            const senha = new Senha('senhaSegura123');
            expect(senha.toString()).toBe('senhaSegura123');
        });

        test('Deve rejeitar senha com menos de 6 caracteres', () => {
            expect(() => new Senha('12345')).toThrow('Senha deve ter no mínimo 6 caracteres');
        });

        test('Deve rejeitar senha vazia', () => {
            expect(() => new Senha('')).toThrow('Senha é obrigatória');
        });

        test('Deve rejeitar senha null', () => {
            expect(() => new Senha(null)).toThrow('Senha é obrigatória');
        });

        test('Deve rejeitar senha undefined', () => {
            expect(() => new Senha(undefined)).toThrow('Senha é obrigatória');
        });

        test('Deve aceitar senha com caracteres especiais', () => {
            const senha = new Senha('Senha@123!');
            expect(senha.toString()).toBe('Senha@123!');
        });
    });

    describe('Métodos', () => {
        test('toString() deve retornar o valor da senha', () => {
            const senha = new Senha('minhaSenha');
            expect(senha.toString()).toBe('minhaSenha');
        });

        test('tamanho deve retornar o comprimento da senha', () => {
            const senha = new Senha('123456');
            expect(senha.tamanho).toBe(6);
        });

        test('tamanho deve retornar comprimento correto para senha longa', () => {
            const senha = new Senha('senhaLonga123456');
            expect(senha.tamanho).toBe(16);
        });
    });
});
