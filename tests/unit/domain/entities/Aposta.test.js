/**
 * Testes Unitários: Aposta Entity
 */

const Aposta = require('../../../../src/domain/entities/Aposta');
const ValorAposta = require('../../../../src/domain/value-objects/ValorAposta');

describe('Entity: Aposta', () => {
    describe('Criação e Validações', () => {
        test('Deve criar aposta válida', () => {
            const aposta = new Aposta({
                id: 1,
                userId: 10,
                eventoId: 5,
                nome: 'João Silva',
                time: 'Time A',
                valor: 100
            });

            expect(aposta.id).toBe(1);
            expect(aposta.userId).toBe(10);
            expect(aposta.eventoId).toBe(5);
            expect(aposta.nome).toBe('João Silva');
            expect(aposta.time).toBe('Time A');
            expect(aposta.valor.toFloat()).toBe(100);
        });

        test('Deve aceitar objeto ValorAposta', () => {
            const valorAposta = new ValorAposta(50);
            const aposta = new Aposta({
                id: 1,
                userId: 10,
                eventoId: 5,
                nome: 'João',
                time: 'Time A',
                valor: valorAposta
            });

            expect(aposta.valor).toBe(valorAposta);
        });

        test('Deve rejeitar userId vazio', () => {
            expect(() => new Aposta({
                id: 1,
                userId: null,
                eventoId: 5,
                nome: 'João',
                time: 'Time A',
                valor: 100
            })).toThrow('userId é obrigatório');
        });

        test('Deve rejeitar eventoId vazio', () => {
            expect(() => new Aposta({
                id: 1,
                userId: 10,
                eventoId: null,
                nome: 'João',
                time: 'Time A',
                valor: 100
            })).toThrow('eventoId é obrigatório');
        });

        test('Deve rejeitar nome vazio', () => {
            expect(() => new Aposta({
                id: 1,
                userId: 10,
                eventoId: 5,
                nome: '',
                time: 'Time A',
                valor: 100
            })).toThrow('Nome do apostador é obrigatório');
        });

        test('Deve rejeitar time vazio', () => {
            expect(() => new Aposta({
                id: 1,
                userId: 10,
                eventoId: 5,
                nome: 'João',
                time: '',
                valor: 100
            })).toThrow('Time é obrigatório');
        });

        test('Deve remover espaços do nome', () => {
            const aposta = new Aposta({
                id: 1,
                userId: 10,
                eventoId: 5,
                nome: '  João Silva  ',
                time: 'Time A',
                valor: 100
            });

            expect(aposta.nome).toBe('João Silva');
        });

        test('Deve remover espaços do time', () => {
            const aposta = new Aposta({
                id: 1,
                userId: 10,
                eventoId: 5,
                nome: 'João',
                time: '  Time A  ',
                valor: 100
            });

            expect(aposta.time).toBe('Time A');
        });

        test('Deve validar valor mínimo via ValorAposta', () => {
            expect(() => new Aposta({
                id: 1,
                userId: 10,
                eventoId: 5,
                nome: 'João',
                time: 'Time A',
                valor: 0.5
            })).toThrow('Valor mínimo da aposta é R$ 1,00');
        });
    });

    describe('Métodos de Verificação', () => {
        test('pertenceAoUsuario() deve retornar true para usuário correto', () => {
            const aposta = new Aposta({
                id: 1,
                userId: 10,
                eventoId: 5,
                nome: 'João',
                time: 'Time A',
                valor: 100
            });

            expect(aposta.pertenceAoUsuario(10)).toBe(true);
        });

        test('pertenceAoUsuario() deve retornar false para usuário incorreto', () => {
            const aposta = new Aposta({
                id: 1,
                userId: 10,
                eventoId: 5,
                nome: 'João',
                time: 'Time A',
                valor: 100
            });

            expect(aposta.pertenceAoUsuario(99)).toBe(false);
        });

        test('pertenceAoEvento() deve retornar true para evento correto', () => {
            const aposta = new Aposta({
                id: 1,
                userId: 10,
                eventoId: 5,
                nome: 'João',
                time: 'Time A',
                valor: 100
            });

            expect(aposta.pertenceAoEvento(5)).toBe(true);
        });

        test('pertenceAoEvento() deve retornar false para evento incorreto', () => {
            const aposta = new Aposta({
                id: 1,
                userId: 10,
                eventoId: 5,
                nome: 'João',
                time: 'Time A',
                valor: 100
            });

            expect(aposta.pertenceAoEvento(99)).toBe(false);
        });

        test('getValorNumerico() deve retornar valor float', () => {
            const aposta = new Aposta({
                id: 1,
                userId: 10,
                eventoId: 5,
                nome: 'João',
                time: 'Time A',
                valor: 100.50
            });

            expect(aposta.getValorNumerico()).toBe(100.50);
        });
    });

    describe('Serialização', () => {
        test('toJSON() deve retornar objeto serializado', () => {
            const aposta = new Aposta({
                id: 1,
                userId: 10,
                eventoId: 5,
                nome: 'João Silva',
                time: 'Time A',
                valor: 100
            });

            const json = aposta.toJSON();

            expect(json).toEqual({
                id: 1,
                userId: 10,
                eventoId: 5,
                nome: 'João Silva',
                time: 'Time A',
                valor: 100,
                timestamp: expect.any(String)
            });
        });
    });
});
