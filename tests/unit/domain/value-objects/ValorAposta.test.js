/**
 * Testes Unitários: ValorAposta Value Object
 */

const ValorAposta = require('../../../../src/domain/value-objects/ValorAposta');

describe('Value Object: ValorAposta', () => {
    describe('Validações', () => {
        test('Deve criar valor mínimo válido (R$ 1)', () => {
            const valor = new ValorAposta(1);
            expect(valor.toFloat()).toBe(1.00);
        });

        test('Deve criar valor maior que mínimo', () => {
            const valor = new ValorAposta(100);
            expect(valor.toFloat()).toBe(100.00);
        });

        test('Deve aceitar valor decimal', () => {
            const valor = new ValorAposta(50.75);
            expect(valor.toFloat()).toBe(50.75);
        });

        test('Deve arredondar para 2 casas decimais', () => {
            const valor = new ValorAposta(10.999);
            expect(valor.toFloat()).toBe(11.00);
        });

        test('Deve rejeitar valor menor que R$ 1', () => {
            expect(() => new ValorAposta(0.99)).toThrow('Valor mínimo da aposta é R$ 1,00');
        });

        test('Deve rejeitar valor zero', () => {
            expect(() => new ValorAposta(0)).toThrow('Valor mínimo da aposta é R$ 1,00');
        });

        test('Deve rejeitar valor negativo', () => {
            expect(() => new ValorAposta(-10)).toThrow('Valor mínimo da aposta é R$ 1,00');
        });

        test('Deve rejeitar valor não numérico', () => {
            expect(() => new ValorAposta('abc')).toThrow('Valor da aposta deve ser um número');
        });

        test('Deve aceitar string numérica válida', () => {
            const valor = new ValorAposta('25.50');
            expect(valor.toFloat()).toBe(25.50);
        });
    });

    describe('Métodos', () => {
        test('toString() deve retornar valor com 2 casas decimais', () => {
            const valor = new ValorAposta(10);
            expect(valor.toString()).toBe('10.00');
        });

        test('toFloat() deve retornar número', () => {
            const valor = new ValorAposta(50.75);
            expect(valor.toFloat()).toBe(50.75);
        });

        test('formatarBRL() deve retornar formato brasileiro', () => {
            const valor = new ValorAposta(100.50);
            expect(valor.formatarBRL()).toBe('R$ 100,50');
        });

        test('somar() deve somar dois ValorAposta', () => {
            const valor1 = new ValorAposta(10);
            const valor2 = new ValorAposta(20);
            const soma = valor1.somar(valor2);
            expect(soma.toFloat()).toBe(30.00);
        });

        test('somar() deve somar ValorAposta com número', () => {
            const valor = new ValorAposta(10);
            const soma = valor.somar(15);
            expect(soma.toFloat()).toBe(25.00);
        });
    });
});
