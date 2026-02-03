/**
 * Testes de Apostas
 * Cobre: criar apostas, validações, filtros por evento ativo
 */

const request = require('supertest');
const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();

describe('Apostas', () => {
    let app;
    let db;
    let userId;
    let eventoId;

    beforeEach((done) => {
        app = express();
        app.use(express.json());
        app.use(session({
            secret: 'test-secret',
            resave: false,
            saveUninitialized: false,
            cookie: { secure: false }
        }));

        db = new sqlite3.Database(':memory:', (err) => {
            if (err) return done(err);

            // Criar tabelas
            db.serialize(() => {
                db.run(`CREATE TABLE usuarios (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nome TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    senha TEXT NOT NULL,
                    isAdmin INTEGER DEFAULT 0,
                    isSuperAdmin INTEGER DEFAULT 0,
                    tipo TEXT DEFAULT 'usuario'
                )`);

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
                    lucroReal REAL DEFAULT 0,
                    FOREIGN KEY (userId) REFERENCES usuarios(id),
                    FOREIGN KEY (eventoId) REFERENCES eventos_historico(id)
                )`);

                // Inserir dados de teste
                db.run("INSERT INTO usuarios (nome, email, senha) VALUES ('Test User', 'test@test.com', 'hash')", function () {
                    userId = this.lastID;

                    db.run("INSERT INTO evento (id, times, aberto) VALUES ('evento-1', ?, 1)",
                        [JSON.stringify(['Time A', 'Time B', 'Time C'])], () => {

                            db.run("INSERT INTO eventos_historico (codigo, nome, times, aberto, status) VALUES ('evt-1', 'Evento Teste', ?, 1, 'ativo')",
                                [JSON.stringify(['Time A', 'Time B', 'Time C'])], function () {
                                    eventoId = this.lastID;
                                    done();
                                });
                        });
                });
            });
        });
    });

    afterEach((done) => {
        db.close(done);
    });

    describe('POST /apostas', () => {
        beforeEach(() => {
            app.post('/apostas', (req, res) => {
                const { time, valor } = req.body;
                const userIdFromSession = req.session.userId || userId;

                if (!userIdFromSession) {
                    return res.status(401).json({ erro: 'Não autenticado' });
                }

                db.get('SELECT * FROM usuarios WHERE id = ?', [userIdFromSession], (err, usuario) => {
                    if (err || !usuario) {
                        return res.status(401).json({ erro: 'Usuário não encontrado' });
                    }

                    if (usuario.isSuperAdmin === 1) {
                        return res.status(403).json({
                            erro: 'Super Administradores não podem apostar. Esta conta é exclusiva para gestão.'
                        });
                    }

                    if (!time || !valor) {
                        return res.status(400).json({ erro: 'Time e valor são obrigatórios' });
                    }

                    if (valor <= 0) {
                        return res.status(400).json({ erro: 'Valor deve ser maior que zero' });
                    }

                    db.run('INSERT INTO apostas (userId, eventoId, nome, time, valor) VALUES (?, ?, ?, ?, ?)',
                        [usuario.id, eventoId, usuario.nome, time, valor],
                        function (err) {
                            if (err) {
                                return res.status(500).json({ erro: 'Erro ao criar aposta' });
                            }

                            res.json({
                                sucesso: true,
                                mensagem: 'Aposta registrada com sucesso!',
                                aposta: {
                                    id: this.lastID,
                                    nome: usuario.nome,
                                    time,
                                    valor
                                }
                            });
                        }
                    );
                });
            });
        });

        test('Deve criar aposta válida', async () => {
            const agent = request.agent(app);
            agent.set('Cookie', `connect.sid=test`);

            const response = await agent
                .post('/apostas')
                .send({
                    time: 'Time A',
                    valor: 100
                });

            expect(response.status).toBe(200);
            expect(response.body.sucesso).toBe(true);
            expect(response.body.aposta.time).toBe('Time A');
            expect(response.body.aposta.valor).toBe(100);
        });

        test('Deve rejeitar aposta sem time', async () => {
            const agent = request.agent(app);

            const response = await agent
                .post('/apostas')
                .send({
                    valor: 100
                });

            expect(response.status).toBe(400);
            expect(response.body.erro).toBe('Time e valor são obrigatórios');
        });

        test('Deve rejeitar aposta com valor zero ou null', async () => {
            const agent = request.agent(app);

            const response = await agent
                .post('/apostas')
                .send({
                    time: 'Time A',
                    valor: 0
                });

            expect(response.status).toBe(400);
            // Valor 0 pode ser interpretado como falsy, então pode cair na validação "obrigatórios"
            expect(response.body.erro).toMatch(/obrigatórios|maior que zero/);
        });

        test('Deve rejeitar aposta com valor negativo', async () => {
            const agent = request.agent(app);

            const response = await agent
                .post('/apostas')
                .send({
                    time: 'Time A',
                    valor: -50
                });

            expect(response.status).toBe(400);
            expect(response.body.erro).toBe('Valor deve ser maior que zero');
        });
    });

    describe('GET /minhas-apostas', () => {
        beforeEach(() => {
            // Inserir apostas de teste
            db.run('INSERT INTO apostas (userId, eventoId, nome, time, valor) VALUES (?, ?, ?, ?, ?)',
                [userId, eventoId, 'Test User', 'Time A', 50]);
            db.run('INSERT INTO apostas (userId, eventoId, nome, time, valor) VALUES (?, ?, ?, ?, ?)',
                [userId, eventoId, 'Test User', 'Time B', 100]);

            app.get('/minhas-apostas', (req, res) => {
                const userIdFromSession = req.session.userId || userId;

                db.all('SELECT * FROM apostas WHERE userId = ? AND eventoId = ?',
                    [userIdFromSession, eventoId],
                    (err, apostas) => {
                        if (err) {
                            return res.status(500).json({ erro: 'Erro ao buscar apostas' });
                        }

                        const valorTotal = apostas.reduce((sum, a) => sum + a.valor, 0);

                        res.json({
                            apostas: apostas || [],
                            total: apostas.length,
                            valorTotal
                        });
                    }
                );
            });
        });

        test('Deve retornar apostas do usuário', async () => {
            const agent = request.agent(app);

            const response = await agent.get('/minhas-apostas');

            expect(response.status).toBe(200);
            expect(response.body.total).toBe(2);
            expect(response.body.valorTotal).toBe(150);
            expect(response.body.apostas).toHaveLength(2);
        });

        test('Deve retornar apenas apostas do evento ativo', async () => {
            // Criar novo evento
            await new Promise((resolve) => {
                db.run("INSERT INTO eventos_historico (codigo, nome, times, aberto, status) VALUES ('evt-2', 'Evento 2', ?, 1, 'finalizado')",
                    [JSON.stringify(['Time A', 'Time B'])], function () {
                        // Inserir aposta em evento antigo
                        db.run('INSERT INTO apostas (userId, eventoId, nome, time, valor) VALUES (?, ?, ?, ?, ?)',
                            [userId, this.lastID, 'Test User', 'Time A', 200], resolve);
                    }
                );
            });

            const agent = request.agent(app);
            const response = await agent.get('/minhas-apostas');

            // Deve retornar apenas as 2 apostas do evento ativo, não a do evento finalizado
            expect(response.body.total).toBe(2);
            expect(response.body.valorTotal).toBe(150);
        });
    });
});
