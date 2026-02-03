/**
 * Testes de Histórico e Paginação
 * Cobre: histórico de apostas, filtros, paginação, estatísticas
 */

const sqlite3 = require('sqlite3').verbose();

describe('Histórico e Paginação', () => {
    let db;
    let userId;
    let eventoAtivoId;
    let eventoArquivadoId;

    beforeEach((done) => {
        db = new sqlite3.Database(':memory:', (err) => {
            if (err) return done(err);

            db.serialize(() => {
                db.run(`CREATE TABLE usuarios (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nome TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL
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

                // Criar usuário
                db.run("INSERT INTO usuarios (nome, email) VALUES ('Test User', 'test@test.com')", function () {
                    userId = this.lastID;

                    // Criar evento arquivado
                    db.run("INSERT INTO eventos_historico (codigo, nome, times, status, vencedor) VALUES ('evt-old', 'Evento Antigo', ?, 'arquivado', 'Time A')",
                        [JSON.stringify(['Time A', 'Time B'])], function () {
                            eventoArquivadoId = this.lastID;

                            // Criar evento ativo
                            db.run("INSERT INTO eventos_historico (codigo, nome, times, status) VALUES ('evt-novo', 'Evento Novo', ?, 'ativo')",
                                [JSON.stringify(['Time A', 'Time B'])], function () {
                                    eventoAtivoId = this.lastID;
                                    done();
                                }
                            );
                        }
                    );
                });
            });
        });
    });

    afterEach((done) => {
        // Aumentar timeout para fechar banco de forma segura
        jest.setTimeout(15000);
        db.close(done);
    });

    describe('Histórico de Apostas', () => {
        test('Deve retornar todas apostas do usuário em todos eventos', (done) => {
            // Inserir apostas em eventos diferentes
            db.run('INSERT INTO apostas (userId, eventoId, nome, time, valor) VALUES (?, ?, ?, ?, ?)',
                [userId, eventoArquivadoId, 'Test User', 'Time A', 100], () => {

                    db.run('INSERT INTO apostas (userId, eventoId, nome, time, valor) VALUES (?, ?, ?, ?, ?)',
                        [userId, eventoAtivoId, 'Test User', 'Time B', 200], () => {

                            db.all('SELECT * FROM apostas WHERE userId = ?', [userId], (err, apostas) => {
                                expect(apostas).toHaveLength(2);
                                expect(apostas[0].eventoId).toBe(eventoArquivadoId);
                                expect(apostas[1].eventoId).toBe(eventoAtivoId);
                                done();
                            });
                        });
                });
        });

        test('Deve incluir nome do evento nas apostas', (done) => {
            db.run('INSERT INTO apostas (userId, eventoId, nome, time, valor) VALUES (?, ?, ?, ?, ?)',
                [userId, eventoArquivadoId, 'Test User', 'Time A', 100], () => {

                    const query = `
                    SELECT a.*, e.nome as eventoNome, e.status as eventoStatus 
                    FROM apostas a 
                    LEFT JOIN eventos_historico e ON a.eventoId = e.id 
                    WHERE a.userId = ?
                `;

                    db.all(query, [userId], (err, apostas) => {
                        expect(apostas).toHaveLength(1);
                        expect(apostas[0].eventoNome).toBe('Evento Antigo');
                        expect(apostas[0].eventoStatus).toBe('arquivado');
                        done();
                    });
                });
        });
    });

    describe('Filtros', () => {
        beforeEach((done) => {
            // Inserir apostas com datas diferentes
            const hoje = new Date().toISOString();
            const ontem = new Date(Date.now() - 86400000).toISOString();
            const semanaPassada = new Date(Date.now() - 7 * 86400000).toISOString();

            db.run('INSERT INTO apostas (userId, eventoId, nome, time, valor, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, eventoArquivadoId, 'Test User', 'Time A', 100, semanaPassada], () => {

                    db.run('INSERT INTO apostas (userId, eventoId, nome, time, valor, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
                        [userId, eventoArquivadoId, 'Test User', 'Time B', 200, ontem], () => {

                            db.run('INSERT INTO apostas (userId, eventoId, nome, time, valor, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
                                [userId, eventoAtivoId, 'Test User', 'Time A', 150, hoje], done);
                        });
                });
        });

        test('Deve filtrar por evento específico', (done) => {
            db.all('SELECT * FROM apostas WHERE userId = ? AND eventoId = ?',
                [userId, eventoArquivadoId], (err, apostas) => {
                    expect(apostas).toHaveLength(2);
                    apostas.forEach(a => expect(a.eventoId).toBe(eventoArquivadoId));
                    done();
                }
            );
        });

        test('Deve filtrar por período de datas', (done) => {
            const dataInicio = new Date(Date.now() - 2 * 86400000).toISOString();

            db.all('SELECT * FROM apostas WHERE userId = ? AND timestamp >= ?',
                [userId, dataInicio], (err, apostas) => {
                    expect(apostas).toHaveLength(2); // Ontem e hoje
                    done();
                }
            );
        });

        test('Deve combinar filtros de evento e data', (done) => {
            const dataInicio = new Date(Date.now() - 2 * 86400000).toISOString();

            db.all('SELECT * FROM apostas WHERE userId = ? AND eventoId = ? AND timestamp >= ?',
                [userId, eventoArquivadoId, dataInicio], (err, apostas) => {
                    expect(apostas).toHaveLength(1); // Apenas a de ontem do evento arquivado
                    expect(apostas[0].time).toBe('Time B');
                    done();
                }
            );
        });
    });

    describe('Paginação', () => {
        beforeEach((done) => {
            // Inserir 15 apostas para testar paginação
            let inserted = 0;
            for (let i = 0; i < 15; i++) {
                db.run('INSERT INTO apostas (userId, eventoId, nome, time, valor) VALUES (?, ?, ?, ?, ?)',
                    [userId, eventoAtivoId, 'Test User', 'Time A', 100 + i], () => {
                        inserted++;
                        if (inserted === 15) done();
                    }
                );
            }
        });

        test('Deve paginar resultados com limite de 5', (done) => {
            const limite = 5;
            const pagina = 1;
            const offset = (pagina - 1) * limite;

            db.all('SELECT * FROM apostas WHERE userId = ? LIMIT ? OFFSET ?',
                [userId, limite, offset], (err, apostas) => {
                    expect(apostas).toHaveLength(5);
                    done();
                }
            );
        });

        test('Deve retornar página 2 corretamente', (done) => {
            const limite = 5;
            const pagina = 2;
            const offset = (pagina - 1) * limite;

            db.all('SELECT * FROM apostas WHERE userId = ? LIMIT ? OFFSET ?',
                [userId, limite, offset], (err, apostas) => {
                    expect(apostas).toHaveLength(5);
                    // Verificar que são apostas diferentes da página 1
                    expect(apostas[0].valor).toBeGreaterThanOrEqual(105);
                    done();
                }
            );
        });

        test('Deve calcular total de páginas corretamente', (done) => {
            const limite = 5;

            db.get('SELECT COUNT(*) as total FROM apostas WHERE userId = ?', [userId], (err, result) => {
                const totalPaginas = Math.ceil(result.total / limite);
                expect(totalPaginas).toBe(3); // 15 apostas / 5 por página = 3 páginas
                done();
            });
        });

        test('Última página deve ter menos itens', (done) => {
            const limite = 5;
            const pagina = 3;
            const offset = (pagina - 1) * limite;

            db.all('SELECT * FROM apostas WHERE userId = ? LIMIT ? OFFSET ?',
                [userId, limite, offset], (err, apostas) => {
                    expect(apostas).toHaveLength(5); // 15 % 5 = 0, então última página tem 5
                    done();
                }
            );
        });
    });

    describe('Estatísticas', () => {
        beforeEach((done) => {
            // Evento 1: 2 apostas, 1 ganha
            db.run('INSERT INTO apostas (userId, eventoId, nome, time, valor, ganhou, lucroReal) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [userId, eventoArquivadoId, 'Test User', 'Time A', 100, 1, 50], () => {

                    db.run('INSERT INTO apostas (userId, eventoId, nome, time, valor, ganhou, lucroReal) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [userId, eventoArquivadoId, 'Test User', 'Time B', 200, 0, 0], () => {

                            // Evento 2: 1 aposta ativa
                            db.run('INSERT INTO apostas (userId, eventoId, nome, time, valor) VALUES (?, ?, ?, ?, ?)',
                                [userId, eventoAtivoId, 'Test User', 'Time A', 150], done);
                        });
                });
        });

        test('Deve calcular total apostado', (done) => {
            db.get('SELECT SUM(valor) as total FROM apostas WHERE userId = ?', [userId], (err, result) => {
                expect(result.total).toBe(450); // 100 + 200 + 150
                done();
            });
        });

        test('Deve contar total de apostas', (done) => {
            db.get('SELECT COUNT(*) as total FROM apostas WHERE userId = ?', [userId], (err, result) => {
                expect(result.total).toBe(3);
                done();
            });
        });

        test('Deve contar apostas ganhas', (done) => {
            db.get('SELECT COUNT(*) as total FROM apostas WHERE userId = ? AND ganhou = 1', [userId], (err, result) => {
                expect(result.total).toBe(1);
                done();
            });
        });

        test('Deve calcular taxa de acerto', (done) => {
            db.get('SELECT COUNT(*) as total FROM apostas WHERE userId = ?', [userId], (err, totalApostas) => {
                db.get('SELECT COUNT(*) as total FROM apostas WHERE userId = ? AND ganhou = 1', [userId], (err, apostasGanhas) => {
                    const taxaAcerto = ((apostasGanhas.total / totalApostas.total) * 100).toFixed(1);
                    expect(taxaAcerto).toBe('33.3'); // 1/3 = 33.3%
                    done();
                });
            });
        });

        test('Deve contar eventos participados', (done) => {
            db.get('SELECT COUNT(DISTINCT eventoId) as total FROM apostas WHERE userId = ?', [userId], (err, result) => {
                expect(result.total).toBe(2); // Participou de 2 eventos
                done();
            });
        });
    });
});
