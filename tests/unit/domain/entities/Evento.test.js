/**
 * Testes Unitários: Evento Entity
 */

const Evento = require('../../../../src/domain/entities/Evento');

describe('Entity: Evento', () => {
    describe('Criação e Validações', () => {
        test('Deve criar evento válido', () => {
            const evento = new Evento({
                id: 1,
                codigo: 'evento-123',
                nome: 'Evento Teste',
                times: ['Time A', 'Time B', 'Time C']
            });

            expect(evento.id).toBe(1);
            expect(evento.codigo).toBe('evento-123');
            expect(evento.nome).toBe('Evento Teste');
            expect(evento.times).toEqual(['Time A', 'Time B', 'Time C']);
            expect(evento.aberto).toBe(true);
            expect(evento.status).toBe('ativo');
        });

        test('Deve gerar código automaticamente', () => {
            const evento = new Evento({
                id: 1,
                times: ['Time A', 'Time B']
            });

            expect(evento.codigo).toMatch(/^evento-\d+$/);
        });

        test('Deve gerar nome automaticamente', () => {
            const evento = new Evento({
                id: 1,
                times: ['Time A', 'Time B']
            });

            expect(evento.nome).toMatch(/^Evento \d{2}\/\d{2}\/\d{4}$/);
        });

        test('Deve rejeitar evento com menos de 2 times', () => {
            expect(() => new Evento({
                id: 1,
                times: ['Time A']
            })).toThrow('Evento deve ter no mínimo 2 times');
        });

        test('Deve rejeitar evento com mais de 10 times', () => {
            const times = Array.from({ length: 11 }, (_, i) => `Time ${i + 1}`);
            
            expect(() => new Evento({
                id: 1,
                times: times
            })).toThrow('Evento pode ter no máximo 10 times');
        });

        test('Deve rejeitar times duplicados', () => {
            expect(() => new Evento({
                id: 1,
                times: ['Time A', 'Time B', 'Time A']
            })).toThrow('Times duplicados não são permitidos');
        });

        test('Deve rejeitar status inválido', () => {
            expect(() => new Evento({
                id: 1,
                times: ['Time A', 'Time B'],
                status: 'invalido'
            })).toThrow('Status inválido');
        });
    });

    describe('Verificações de Estado', () => {
        test('estaAberto() deve retornar true para evento ativo e aberto', () => {
            const evento = new Evento({
                id: 1,
                times: ['Time A', 'Time B'],
                aberto: true,
                status: 'ativo'
            });

            expect(evento.estaAberto()).toBe(true);
        });

        test('estaAberto() deve retornar false para evento ativo mas fechado', () => {
            const evento = new Evento({
                id: 1,
                times: ['Time A', 'Time B'],
                aberto: false,
                status: 'ativo'
            });

            expect(evento.estaAberto()).toBe(false);
        });

        test('estaAberto() deve retornar false para evento finalizado', () => {
            const evento = new Evento({
                id: 1,
                times: ['Time A', 'Time B'],
                aberto: true,
                status: 'finalizado'
            });

            expect(evento.estaAberto()).toBe(false);
        });

        test('contemTime() deve retornar true para time existente', () => {
            const evento = new Evento({
                id: 1,
                times: ['Time A', 'Time B', 'Time C']
            });

            expect(evento.contemTime('Time B')).toBe(true);
        });

        test('contemTime() deve retornar false para time inexistente', () => {
            const evento = new Evento({
                id: 1,
                times: ['Time A', 'Time B']
            });

            expect(evento.contemTime('Time Z')).toBe(false);
        });
    });

    describe('Ações de Evento', () => {
        test('fechar() deve fechar evento ativo', () => {
            const evento = new Evento({
                id: 1,
                times: ['Time A', 'Time B'],
                aberto: true,
                status: 'ativo'
            });

            evento.fechar();

            expect(evento.aberto).toBe(false);
        });

        test('fechar() deve rejeitar evento não ativo', () => {
            const evento = new Evento({
                id: 1,
                times: ['Time A', 'Time B'],
                status: 'finalizado'
            });

            expect(() => evento.fechar()).toThrow('Apenas eventos ativos podem ser fechados');
        });

        test('abrir() deve abrir evento ativo', () => {
            const evento = new Evento({
                id: 1,
                times: ['Time A', 'Time B'],
                aberto: false,
                status: 'ativo'
            });

            evento.abrir();

            expect(evento.aberto).toBe(true);
        });

        test('abrir() deve rejeitar evento com vencedor', () => {
            const evento = new Evento({
                id: 1,
                times: ['Time A', 'Time B'],
                aberto: false,
                status: 'ativo',
                vencedor: 'Time A'
            });

            expect(() => evento.abrir()).toThrow('Evento com vencedor não pode ser reaberto');
        });

        test('definirVencedor() deve definir vencedor válido', () => {
            const evento = new Evento({
                id: 1,
                times: ['Time A', 'Time B'],
                aberto: false
            });

            evento.definirVencedor('Time A');

            expect(evento.vencedor).toBe('Time A');
            expect(evento.status).toBe('finalizado');
            expect(evento.finalizadoEm).toBeTruthy();
        });

        test('definirVencedor() deve rejeitar se apostas abertas', () => {
            const evento = new Evento({
                id: 1,
                times: ['Time A', 'Time B'],
                aberto: true
            });

            expect(() => evento.definirVencedor('Time A')).toThrow('Feche as apostas antes de definir o vencedor');
        });

        test('definirVencedor() deve rejeitar time inválido', () => {
            const evento = new Evento({
                id: 1,
                times: ['Time A', 'Time B'],
                aberto: false
            });

            expect(() => evento.definirVencedor('Time Z')).toThrow('Time vencedor não está na lista de times do evento');
        });

        test('arquivar() deve arquivar evento', () => {
            const evento = new Evento({
                id: 1,
                times: ['Time A', 'Time B']
            });

            evento.arquivar();

            expect(evento.status).toBe('arquivado');
            expect(evento.finalizadoEm).toBeTruthy();
        });
    });

    describe('Serialização', () => {
        test('toJSON() deve retornar objeto serializado', () => {
            const evento = new Evento({
                id: 1,
                codigo: 'evento-123',
                nome: 'Evento Teste',
                times: ['Time A', 'Time B']
            });

            const json = evento.toJSON();

            expect(json).toEqual({
                id: 1,
                codigo: 'evento-123',
                nome: 'Evento Teste',
                times: ['Time A', 'Time B'],
                aberto: true,
                vencedor: null,
                status: 'ativo',
                criadoEm: expect.any(String),
                finalizadoEm: null
            });
        });
    });
});
