/**
 * Testes de Eventos e Reset
 * Cobre: criar eventos, finalizar eventos, reset preservando histórico
 */

const sqlite3 = require('sqlite3').verbose();

describe('Eventos e Reset', () => {
    let db;

    beforeEach((done) => {
        db = new sqlite3.Database(':memory:', (err) => {
            if (err) return done(err);

            db.serialize(() => {
                db.run(`CREATE TABLE evento (
                    id TEXT PRIMARY KEY,
                    times TEXT NOT NULL,
                    aberto INTEGER DEFAULT 1,
                    vencedor TEXT
                )`);

                db.run(`CREATE TABLE eventos_historico (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    codigo TEXT UNIQUE NOT NULL,
                    nome TEXT NOT NULL,
                    times TEXT NOT NULL,
                    aberto INTEGER DEFAULT 1,
                    vencedor TEXT,
                    status TEXT DEFAULT 'ativo',
                    criadoEm DATETIME DEFAULT CURRENT_TIMESTAMP,
                    finalizadoEm DATETIME
                )`);

                db.run(`CREATE TABLE apostas (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    userId INTEGER NOT NULL,
                    eventoId INTEGER,
                    nome TEXT NOT NULL,
                    time TEXT NOT NULL,
                    valor REAL NOT NULL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    ganhou INTEGER DEFAULT 0,
                    lucroReal REAL DEFAULT 0
                )`);

                db.run("INSERT INTO evento (id, times, aberto) VALUES ('evento-1', ?, 1)",
                    [JSON.stringify(['Time A', 'Time B'])], done);
            });
        });
    });

    afterEach((done) => {
        db.close(done);
    });

    describe('Criar Novo Evento', () => {
        test('Deve criar evento com status ativo', (done) => {
            const codigo = `evento-${Date.now()}`;
            const nome = `Evento Teste`;
            const timesJson = JSON.stringify(['Time A', 'Time B']);

            db.run('INSERT INTO eventos_historico (codigo, nome, times, aberto, status) VALUES (?, ?, ?, 1, ?)',
                [codigo, nome, timesJson, 'ativo'],
                function (err) {
                    expect(err).toBeNull();
                    expect(this.lastID).toBeGreaterThan(0);

                    // Verificar se foi criado
                    db.get('SELECT * FROM eventos_historico WHERE id = ?', [this.lastID], (err, evento) => {
                        expect(evento).toBeDefined();
                        expect(evento.status).toBe('ativo');
                        expect(evento.aberto).toBe(1);
                        expect(JSON.parse(evento.times)).toEqual(['Time A', 'Time B']);
                        done();
                    });
                }
            );
        });

        test('Deve criar evento com código único', (done) => {
            const codigo1 = `evento-${Date.now()}`;
            const codigo2 = `evento-${Date.now() + 1}`;

            db.run('INSERT INTO eventos_historico (codigo, nome, times, status) VALUES (?, ?, ?, ?)',
                [codigo1, 'Evento 1', '["Time A"]', 'ativo'], function () {
                    const id1 = this.lastID;

                    db.run('INSERT INTO eventos_historico (codigo, nome, times, status) VALUES (?, ?, ?, ?)',
                        [codigo2, 'Evento 2', '["Time B"]', 'ativo'], function () {
                            const id2 = this.lastID;

                            expect(id1).not.toBe(id2);
                            done();
                        }
                    );
                }
            );
        });
    });

    describe('Finalizar Evento', () => {
        test('Deve atualizar status para finalizado', (done) => {
            db.run('INSERT INTO eventos_historico (codigo, nome, times, status) VALUES (?, ?, ?, ?)',
                ['evt-teste', 'Evento', '["Time A"]', 'ativo'], function () {
                    const eventoId = this.lastID;

                    db.run('UPDATE eventos_historico SET status = ?, vencedor = ?, finalizadoEm = ? WHERE id = ?',
                        ['finalizado', 'Time A', new Date().toISOString(), eventoId], (err) => {
                            expect(err).toBeNull();

                            db.get('SELECT * FROM eventos_historico WHERE id = ?', [eventoId], (err, evento) => {
                                expect(evento.status).toBe('finalizado');
                                expect(evento.vencedor).toBe('Time A');
                                expect(evento.finalizadoEm).toBeDefined();
                                done();
                            });
                        }
                    );
                }
            );
        });
    });

    describe('Reset com Preservação de Histórico', () => {
        test('Deve arquivar evento antigo e criar novo', (done) => {
            // Criar evento ativo
            db.run('INSERT INTO eventos_historico (codigo, nome, times, status) VALUES (?, ?, ?, ?)',
                ['evt-old', 'Evento Antigo', '["Time A"]', 'ativo'], function () {
                    const oldEventoId = this.lastID;

                    // Inserir apostas no evento antigo
                    db.run('INSERT INTO apostas (userId, eventoId, nome, time, valor) VALUES (?, ?, ?, ?, ?)',
                        [1, oldEventoId, 'User 1', 'Time A', 100], () => {

                            // Simular reset: arquivar evento antigo
                            db.run('UPDATE eventos_historico SET status = ?, finalizadoEm = ? WHERE id = ?',
                                ['arquivado', new Date().toISOString(), oldEventoId], () => {

                                    // Criar novo evento
                                    db.run('INSERT INTO eventos_historico (codigo, nome, times, status) VALUES (?, ?, ?, ?)',
                                        ['evt-new', 'Evento Novo', '["Time B"]', 'ativo'], function () {
                                            const newEventoId = this.lastID;

                                            // Verificar que evento antigo foi arquivado
                                            db.get('SELECT * FROM eventos_historico WHERE id = ?', [oldEventoId], (err, old) => {
                                                expect(old.status).toBe('arquivado');
                                                expect(old.finalizadoEm).toBeDefined();

                                                // Verificar que novo evento está ativo
                                                db.get('SELECT * FROM eventos_historico WHERE id = ?', [newEventoId], (err, novo) => {
                                                    expect(novo.status).toBe('ativo');

                                                    // Verificar que apostas antigas foram preservadas
                                                    db.get('SELECT COUNT(*) as total FROM apostas WHERE eventoId = ?', [oldEventoId], (err, result) => {
                                                        expect(result.total).toBe(1);
                                                        done();
                                                    });
                                                });
                                            });
                                        }
                                    );
                                });
                        });
                }
            );
        });

        test('Deve manter múltiplos eventos no histórico', (done) => {
            const eventos = [
                ['evt-1', 'Evento 1', 'arquivado'],
                ['evt-2', 'Evento 2', 'arquivado'],
                ['evt-3', 'Evento 3', 'ativo']
            ];

            let completed = 0;

            eventos.forEach(([codigo, nome, status]) => {
                db.run('INSERT INTO eventos_historico (codigo, nome, times, status) VALUES (?, ?, ?, ?)',
                    [codigo, nome, '["Time A"]', status], () => {
                        completed++;
                        if (completed === eventos.length) {
                            // Verificar total de eventos
                            db.get('SELECT COUNT(*) as total FROM eventos_historico', (err, result) => {
                                expect(result.total).toBe(3);

                                // Verificar eventos arquivados
                                db.get("SELECT COUNT(*) as total FROM eventos_historico WHERE status = 'arquivado'", (err, result) => {
                                    expect(result.total).toBe(2);

                                    // Verificar evento ativo
                                    db.get("SELECT COUNT(*) as total FROM eventos_historico WHERE status = 'ativo'", (err, result) => {
                                        expect(result.total).toBe(1);
                                        done();
                                    });
                                });
                            });
                        }
                    }
                );
            });
        });
    });

    describe('Buscar Evento Ativo', () => {
        test('Deve retornar apenas o evento ativo', (done) => {
            // Criar múltiplos eventos
            db.run('INSERT INTO eventos_historico (codigo, nome, times, status) VALUES (?, ?, ?, ?)',
                ['evt-1', 'Evento Arquivado', '["Time A"]', 'arquivado'], () => {

                    db.run('INSERT INTO eventos_historico (codigo, nome, times, status) VALUES (?, ?, ?, ?)',
                        ['evt-2', 'Evento Finalizado', '["Time B"]', 'finalizado'], () => {

                            db.run('INSERT INTO eventos_historico (codigo, nome, times, status) VALUES (?, ?, ?, ?)',
                                ['evt-3', 'Evento Ativo', '["Time C"]', 'ativo'], function () {
                                    const eventoAtivoId = this.lastID;

                                    // Buscar evento ativo
                                    db.get("SELECT * FROM eventos_historico WHERE status = 'ativo' ORDER BY id DESC LIMIT 1", (err, evento) => {
                                        expect(evento).toBeDefined();
                                        expect(evento.id).toBe(eventoAtivoId);
                                        expect(evento.status).toBe('ativo');
                                        expect(evento.nome).toBe('Evento Ativo');
                                        done();
                                    });
                                }
                            );
                        });
                });
        });

        test('Deve retornar null se não houver evento ativo', (done) => {
            db.run('INSERT INTO eventos_historico (codigo, nome, times, status) VALUES (?, ?, ?, ?)',
                ['evt-1', 'Evento Arquivado', '["Time A"]', 'arquivado'], () => {

                    db.get("SELECT * FROM eventos_historico WHERE status = 'ativo' ORDER BY id DESC LIMIT 1", (err, evento) => {
                        expect(evento).toBeUndefined();
                        done();
                    });
                });
        });
    });
});
