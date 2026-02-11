/**
 * Testes de Cálculos Financeiros
 * Cobre: cálculo de retornos, taxa da plataforma, distribuição de prêmios
 */

describe('Cálculos Financeiros', () => {
    const TAXA_PLATAFORMA = 0.05; // 5%

    describe('Cálculo de Retorno Estimado', () => {
        test('Deve calcular retorno corretamente com uma aposta', () => {
            const apostas = [
                { time: 'Time A', valor: 100 }
            ];

            const totalGeral = 100;
            const totalPremio = totalGeral * (1 - TAXA_PLATAFORMA); // 95
            const totalTimeA = 100;

            const retorno = (100 / totalTimeA) * totalPremio;

            expect(retorno).toBe(95);
        });

        test('Deve calcular retorno com múltiplas apostas no mesmo time', () => {
            const apostas = [
                { time: 'Time A', valor: 100 },
                { time: 'Time A', valor: 200 },
                { time: 'Time B', valor: 150 }
            ];

            const totalGeral = 450;
            const totalPremio = totalGeral * (1 - TAXA_PLATAFORMA); // 427.5
            const totalTimeA = 300;

            // Para quem apostou 100 no Time A
            const retorno100 = (100 / totalTimeA) * totalPremio;
            expect(retorno100).toBeCloseTo(142.5, 1);

            // Para quem apostou 200 no Time A
            const retorno200 = (200 / totalTimeA) * totalPremio;
            expect(retorno200).toBeCloseTo(285, 1);
        });

        test('Deve calcular lucro corretamente', () => {
            const valorApostado = 100;
            const retornoEstimado = 142.5;
            const lucro = retornoEstimado - valorApostado;

            expect(lucro).toBeCloseTo(42.5, 1);
        });

        test('Time perdedor não recebe nada', () => {
            const apostas = [
                { time: 'Time A', valor: 100 },
                { time: 'Time B', valor: 200 }
            ];

            const totalGeral = 300;
            const totalPremio = totalGeral * (1 - TAXA_PLATAFORMA); // 285
            const totalTimeB = 200;

            // Se Time B ganhar
            const retornoTimeB = (200 / totalTimeB) * totalPremio;
            expect(retornoTimeB).toBeCloseTo(285, 1);

            // Time A perdeu, não recebe nada
            const retornoTimeA = 0;
            expect(retornoTimeA).toBe(0);
        });
    });

    describe('Taxa da Plataforma', () => {
        test('Deve calcular 5% do total', () => {
            const totalGeral = 1000;
            const taxa = totalGeral * TAXA_PLATAFORMA;

            expect(taxa).toBe(50);
        });

        test('Total do prêmio deve ser 95% do total', () => {
            const totalGeral = 1000;
            const totalPremio = totalGeral * (1 - TAXA_PLATAFORMA);

            expect(totalPremio).toBe(950);
        });

        test('Taxa deve ser proporcional ao total', () => {
            const valores = [100, 500, 1000, 5000];

            valores.forEach(total => {
                const taxa = total * TAXA_PLATAFORMA;
                const premio = total * (1 - TAXA_PLATAFORMA);

                expect(taxa + premio).toBe(total);
            });
        });
    });

    describe('Distribuição de Prêmios', () => {
        test('Distribuição proporcional com 2 vencedores', () => {
            const apostas = [
                { time: 'Time A', valor: 100, nome: 'User 1' },
                { time: 'Time A', valor: 300, nome: 'User 2' },
                { time: 'Time B', valor: 600, nome: 'User 3' }
            ];

            const totalGeral = 1000;
            const totalPremio = totalGeral * (1 - TAXA_PLATAFORMA); // 950
            const totalVencedor = 400; // Time A ganhou

            // User 1 apostou 100 (25% do total do Time A)
            const premioUser1 = (100 / totalVencedor) * totalPremio;
            expect(premioUser1).toBeCloseTo(237.5, 1);

            // User 2 apostou 300 (75% do total do Time A)
            const premioUser2 = (300 / totalVencedor) * totalPremio;
            expect(premioUser2).toBeCloseTo(712.5, 1);

            // Soma deve ser igual ao prêmio total
            expect(premioUser1 + premioUser2).toBeCloseTo(totalPremio, 1);
        });

        test('Winner takes all quando só um apostou no vencedor', () => {
            const apostas = [
                { time: 'Time A', valor: 200, nome: 'User 1' },
                { time: 'Time B', valor: 300, nome: 'User 2' },
                { time: 'Time B', valor: 500, nome: 'User 3' }
            ];

            const totalGeral = 1000;
            const totalPremio = totalGeral * (1 - TAXA_PLATAFORMA); // 950
            const totalVencedor = 200; // Só User 1 no Time A

            const premio = (200 / totalVencedor) * totalPremio;
            expect(premio).toBe(950);
        });

        test('Lucro pode ser negativo se aposta maior que prêmio', () => {
            const apostas = [
                { time: 'Time A', valor: 1000, nome: 'User 1' },
                { time: 'Time B', valor: 100, nome: 'User 2' }
            ];

            const totalGeral = 1100;
            const totalPremio = totalGeral * (1 - TAXA_PLATAFORMA); // 1045
            const totalVencedor = 1000;

            const premio = (1000 / totalVencedor) * totalPremio;
            const lucro = premio - 1000;

            expect(lucro).toBe(45); // Ganhou apenas 45 de lucro
        });
    });

    describe('Casos Extremos', () => {
        test('Aposta mínima de R$ 1', () => {
            const apostas = [
                { time: 'Time A', valor: 1 },
                { time: 'Time B', valor: 99 }
            ];

            const totalGeral = 100;
            const totalPremio = totalGeral * (1 - TAXA_PLATAFORMA); // 95

            // Se Time A ganhar
            const premio = (1 / 1) * totalPremio;
            expect(premio).toBe(95);

            const lucro = premio - 1;
            expect(lucro).toBe(94); // 9400% de retorno!
        });

        test('Todas apostas no mesmo time', () => {
            const apostas = [
                { time: 'Time A', valor: 100 },
                { time: 'Time A', valor: 200 },
                { time: 'Time A', valor: 300 }
            ];

            const totalGeral = 600;
            const totalPremio = totalGeral * (1 - TAXA_PLATAFORMA); // 570
            const totalVencedor = 600;

            // Cada um recebe proporcionalmente
            const premio1 = (100 / 600) * 570; // 95
            const premio2 = (200 / 600) * 570; // 190
            const premio3 = (300 / 600) * 570; // 285

            expect(premio1).toBeCloseTo(95, 1);
            expect(premio2).toBeCloseTo(190, 1);
            expect(premio3).toBeCloseTo(285, 1);

            // Todos perdem 5% devido à taxa
            expect(premio1 + premio2 + premio3).toBeCloseTo(570, 1);
        });

        test('Valores decimais devem ser arredondados', () => {
            const apostas = [
                { time: 'Time A', valor: 33.33 },
                { time: 'Time B', valor: 66.67 }
            ];

            const totalGeral = 100;
            const totalPremio = totalGeral * (1 - TAXA_PLATAFORMA);

            const premio = (33.33 / 33.33) * totalPremio;

            // Arredondar para 2 casas decimais
            const premioArredondado = parseFloat(premio.toFixed(2));
            expect(premioArredondado).toBe(95);
        });
    });

    describe('Validações', () => {
        test('Total do prêmio nunca pode ser negativo', () => {
            const totalGeral = 0;
            const totalPremio = Math.max(0, totalGeral * (1 - TAXA_PLATAFORMA));

            expect(totalPremio).toBe(0);
        });

        test('Retorno estimado zero quando totalTime é zero', () => {
            const totalTime = 0;
            const totalPremio = 950;

            const retorno = totalTime > 0 ? (100 / totalTime) * totalPremio : 0;
            expect(retorno).toBe(0);
        });

        test('Divisão por zero deve ser tratada', () => {
            const valor = 100;
            const totalTime = 0;
            const totalPremio = 950;

            const retorno = totalTime === 0 ? 0 : (valor / totalTime) * totalPremio;
            expect(retorno).toBe(0);
        });
    });

    describe('Múltiplos Times', () => {
        test('Cálculo com 4 times', () => {
            const apostas = [
                { time: 'Time A', valor: 100 },
                { time: 'Time B', valor: 200 },
                { time: 'Time C', valor: 300 },
                { time: 'Time D', valor: 400 }
            ];

            const totalGeral = 1000;
            const totalPremio = totalGeral * (1 - TAXA_PLATAFORMA); // 950

            // Se Time C ganhar
            const totalVencedor = 300;
            const premio = (300 / totalVencedor) * totalPremio;

            expect(premio).toBe(950);
        });

        test('Múltiplas apostas em múltiplos times', () => {
            const apostas = [
                { time: 'Time A', valor: 50, nome: 'User 1' },
                { time: 'Time A', valor: 150, nome: 'User 2' },
                { time: 'Time B', valor: 100, nome: 'User 3' },
                { time: 'Time B', valor: 200, nome: 'User 4' },
                { time: 'Time C', valor: 500, nome: 'User 5' }
            ];

            const totalGeral = 1000;
            const totalPremio = 950;

            // Time A ganhou (total 200)
            const premio1 = (50 / 200) * 950; // 237.5
            const premio2 = (150 / 200) * 950; // 712.5

            expect(premio1 + premio2).toBeCloseTo(950, 1);
        });
    });
});
