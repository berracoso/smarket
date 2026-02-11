/**
 * Testes Unitários: CalculadoraPremios Domain Service
 */

const CalculadoraPremios = require('../../../../src/domain/services/CalculadoraPremios');
const TaxaPlataforma = require('../../../../src/domain/value-objects/TaxaPlataforma');

describe('Domain Service: CalculadoraPremios', () => {
    let calculadora;
    
    beforeEach(() => {
        calculadora = new CalculadoraPremios(0.05); // 5% taxa
    });

    describe('Cálculo de Retorno Estimado', () => {
        test('Deve calcular retorno com uma aposta', () => {
            const apostas = [];
            const retorno = calculadora.calcularRetornoEstimado(apostas, 'Time A', 100);
            
            // 100 total, taxa 5% = 95 prêmio, aposta 100 = retorna 95
            expect(retorno).toBe(95);
        });

        test('Deve calcular retorno com múltiplas apostas no mesmo time', () => {
            const apostas = [
                { time: 'Time A', valor: 100 },
                { time: 'Time A', valor: 200 }
            ];
            
            const retorno = calculadora.calcularRetornoEstimado(apostas, 'Time A', 50);
            
            // Total: 350, Prêmio: 332.5, Time A: 350, Retorno: (50/350) * 332.5 = 47.5
            expect(retorno).toBeCloseTo(47.5, 1);
        });

        test('Deve calcular retorno em azarão', () => {
            const apostas = [
                { time: 'Time A', valor: 300 },
                { time: 'Time B', valor: 50 }
            ];
            
            const retorno = calculadora.calcularRetornoEstimado(apostas, 'Time B', 50);
            
            // Total: 400, Prêmio: 380, Time B: 100, Retorno: (50/100) * 380 = 190
            expect(retorno).toBe(190);
        });

        test('Deve retornar 0 quando totalTime é 0', () => {
            const apostas = [];
            const retorno = calculadora.calcularRetornoEstimado(apostas, 'Time A', 0);
            
            expect(retorno).toBe(0);
        });
    });

    describe('Cálculo de Distribuição de Prêmios', () => {
        test('Deve distribuir prêmio entre vencedores proporcionalmente', () => {
            const apostas = [
                { time: 'Time A', valor: 100, nome: 'João' },
                { time: 'Time A', valor: 200, nome: 'Maria' },
                { time: 'Time B', valor: 300, nome: 'Pedro' }
            ];
            
            const distribuicao = calculadora.calcularDistribuicao(apostas, 'Time A');
            
            // Total: 600, Prêmio: 570, Time A: 300
            // João: (100/300) * 570 = 190
            // Maria: (200/300) * 570 = 380
            
            expect(distribuicao).toHaveLength(2);
            expect(distribuicao[0]).toEqual({
                nome: 'João',
                apostado: 100,
                ganho: 190,
                lucro: 90
            });
            expect(distribuicao[1]).toEqual({
                nome: 'Maria',
                apostado: 200,
                ganho: 380,
                lucro: 180
            });
        });

        test('Deve retornar array vazio quando ninguém apostou no vencedor', () => {
            const apostas = [
                { time: 'Time A', valor: 100, nome: 'João' },
                { time: 'Time B', valor: 200, nome: 'Maria' }
            ];
            
            const distribuicao = calculadora.calcularDistribuicao(apostas, 'Time C');
            
            expect(distribuicao).toEqual([]);
        });

        test('Winner takes all quando só um apostou no vencedor', () => {
            const apostas = [
                { time: 'Time A', valor: 100, nome: 'João' },
                { time: 'Time B', valor: 200, nome: 'Maria' },
                { time: 'Time B', valor: 300, nome: 'Pedro' }
            ];
            
            const distribuicao = calculadora.calcularDistribuicao(apostas, 'Time A');
            
            // Total: 600, Prêmio: 570, Time A: 100
            // João leva tudo: 570
            
            expect(distribuicao).toHaveLength(1);
            expect(distribuicao[0]).toEqual({
                nome: 'João',
                apostado: 100,
                ganho: 570,
                lucro: 470
            });
        });
    });

    describe('Cálculo de Resumo', () => {
        test('Deve calcular resumo completo do evento', () => {
            const apostas = [
                { time: 'Time A', valor: 100 },
                { time: 'Time A', valor: 200 },
                { time: 'Time B', valor: 150 },
                { time: 'Time C', valor: 50 }
            ];
            
            const evento = {
                times: ['Time A', 'Time B', 'Time C'],
                aberto: true,
                vencedor: null
            };
            
            const resumo = calculadora.calcularResumo(apostas, evento);
            
            expect(resumo.totalGeral).toBe(500);
            expect(resumo.taxaPlataforma).toBe(25);
            expect(resumo.totalPremio).toBe(475);
            expect(resumo.percentualTaxa).toBe('5%');
            expect(resumo.times['Time A'].total).toBe(300);
            expect(resumo.times['Time A'].percentual).toBe('60.00');
            expect(resumo.times['Time B'].total).toBe(150);
            expect(resumo.times['Time B'].percentual).toBe('30.00');
            expect(resumo.times['Time C'].total).toBe(50);
            expect(resumo.times['Time C'].percentual).toBe('10.00');
        });
    });

    describe('Taxa Customizada', () => {
        test('Deve usar TaxaPlataforma customizada', () => {
            const taxaCustomizada = new TaxaPlataforma(0.10); // 10%
            const calc = new CalculadoraPremios(taxaCustomizada);
            
            const apostas = [];
            const retorno = calc.calcularRetornoEstimado(apostas, 'Time A', 100);
            
            // 100 total, taxa 10% = 90 prêmio
            expect(retorno).toBe(90);
        });
    });
});
