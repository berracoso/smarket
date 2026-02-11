/**
 * Testes Unitários: TaxaPlataforma Value Object
 */

const TaxaPlataforma = require('../../../../src/domain/value-objects/TaxaPlataforma');

describe('Value Object: TaxaPlataforma', () => {
    describe('Validações', () => {
        test('Deve criar taxa padrão de 5%', () => {
            const taxa = new TaxaPlataforma();
            expect(taxa.toFloat()).toBe(0.05);
        });

        test('Deve criar taxa personalizada', () => {
            const taxa = new TaxaPlataforma(0.10);
            expect(taxa.toFloat()).toBe(0.10);
        });

        test('Deve rejeitar taxa negativa', () => {
            expect(() => new TaxaPlataforma(-0.05)).toThrow('Taxa deve estar entre 0 e 1');
        });

        test('Deve rejeitar taxa maior ou igual a 100%', () => {
            expect(() => new TaxaPlataforma(1)).toThrow('Taxa deve estar entre 0 e 1');
        });

        test('Deve rejeitar taxa maior que 100%', () => {
            expect(() => new TaxaPlataforma(1.5)).toThrow('Taxa deve estar entre 0 e 1');
        });

        test('Deve rejeitar taxa não numérica', () => {
            expect(() => new TaxaPlataforma('0.05')).toThrow('Taxa deve ser um número');
        });

        test('Deve aceitar taxa de 0% (sem taxa)', () => {
            const taxa = new TaxaPlataforma(0);
            expect(taxa.toFloat()).toBe(0);
        });
    });

    describe('Cálculos', () => {
        test('calcularTaxa() deve calcular 5% de R$ 100', () => {
            const taxa = new TaxaPlataforma(0.05);
            const resultado = taxa.calcularTaxa(100);
            expect(resultado).toBe(5);
        });

        test('calcularTaxa() deve calcular 10% de R$ 500', () => {
            const taxa = new TaxaPlataforma(0.10);
            const resultado = taxa.calcularTaxa(500);
            expect(resultado).toBe(50);
        });

        test('calcularPremioLiquido() deve calcular 95% de R$ 100 (taxa 5%)', () => {
            const taxa = new TaxaPlataforma(0.05);
            const resultado = taxa.calcularPremioLiquido(100);
            expect(resultado).toBe(95);
        });

        test('calcularPremioLiquido() deve calcular 90% de R$ 1000 (taxa 10%)', () => {
            const taxa = new TaxaPlataforma(0.10);
            const resultado = taxa.calcularPremioLiquido(1000);
            expect(resultado).toBe(900);
        });

        test('percentualFormatado deve retornar "5%"', () => {
            const taxa = new TaxaPlataforma(0.05);
            expect(taxa.percentualFormatado).toBe('5%');
        });

        test('percentualFormatado deve retornar "10%"', () => {
            const taxa = new TaxaPlataforma(0.10);
            expect(taxa.percentualFormatado).toBe('10%');
        });
    });
});
