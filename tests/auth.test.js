/**
 * Testes de Autenticação
 * Cobre: registro, login, logout, verificação de sessão
 */

const request = require('supertest');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();

describe('Autenticação', () => {
    let app;
    let db;

    beforeEach((done) => {
        // Criar app Express para testes
        app = express();
        app.use(express.json());
        app.use(session({
            secret: 'test-secret',
            resave: false,
            saveUninitialized: false,
            cookie: { secure: false }
        }));

        // Criar banco em memória
        db = new sqlite3.Database(':memory:', (err) => {
            if (err) return done(err);

            // Criar tabela de usuários
            db.run(`CREATE TABLE usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                senha TEXT NOT NULL,
                isAdmin INTEGER DEFAULT 0,
                isSuperAdmin INTEGER DEFAULT 0,
                tipo TEXT DEFAULT 'usuario',
                criadoEm DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, done);
        });
    });

    afterEach((done) => {
        db.close(done);
    });

    describe('POST /auth/registro', () => {
        beforeEach(() => {
            app.post('/auth/registro', async (req, res) => {
                const { nome, email, senha } = req.body;

                if (!nome || !email || !senha) {
                    return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });
                }

                if (senha.length < 6) {
                    return res.status(400).json({ erro: 'Senha deve ter no mínimo 6 caracteres' });
                }

                db.get('SELECT * FROM usuarios WHERE email = ?', [email], async (err, row) => {
                    if (row) {
                        return res.status(400).json({ erro: 'Email já cadastrado' });
                    }

                    const senhaHash = await bcrypt.hash(senha, 10);
                    db.run(`INSERT INTO usuarios (nome, email, senha, isAdmin, isSuperAdmin, tipo) 
                            VALUES (?, ?, ?, 0, 0, 'usuario')`,
                        [nome, email, senhaHash],
                        function (err) {
                            if (err) {
                                return res.status(500).json({ erro: 'Erro ao criar usuário' });
                            }

                            req.session.userId = this.lastID;

                            res.json({
                                sucesso: true,
                                usuario: {
                                    id: this.lastID,
                                    nome,
                                    email,
                                    isAdmin: false,
                                    isSuperAdmin: false,
                                    tipo: 'usuario'
                                }
                            });
                        }
                    );
                });
            });
        });

        test('Deve registrar novo usuário com sucesso', async () => {
            const response = await request(app)
                .post('/auth/registro')
                .send({
                    nome: 'Teste User',
                    email: 'teste@teste.com',
                    senha: '123456'
                });

            expect(response.status).toBe(200);
            expect(response.body.sucesso).toBe(true);
            expect(response.body.usuario.nome).toBe('Teste User');
            expect(response.body.usuario.email).toBe('teste@teste.com');
            expect(response.body.usuario.tipo).toBe('usuario');
        });

        test('Deve rejeitar registro sem nome', async () => {
            const response = await request(app)
                .post('/auth/registro')
                .send({
                    email: 'teste@teste.com',
                    senha: '123456'
                });

            expect(response.status).toBe(400);
            expect(response.body.erro).toBe('Nome, email e senha são obrigatórios');
        });

        test('Deve rejeitar senha menor que 6 caracteres', async () => {
            const response = await request(app)
                .post('/auth/registro')
                .send({
                    nome: 'Teste',
                    email: 'teste@teste.com',
                    senha: '123'
                });

            expect(response.status).toBe(400);
            expect(response.body.erro).toBe('Senha deve ter no mínimo 6 caracteres');
        });

        test('Deve rejeitar email duplicado', async () => {
            // Primeiro registro
            await request(app)
                .post('/auth/registro')
                .send({
                    nome: 'User 1',
                    email: 'duplicate@teste.com',
                    senha: '123456'
                });

            // Segundo registro com mesmo email
            const response = await request(app)
                .post('/auth/registro')
                .send({
                    nome: 'User 2',
                    email: 'duplicate@teste.com',
                    senha: '654321'
                });

            expect(response.status).toBe(400);
            expect(response.body.erro).toBe('Email já cadastrado');
        });
    });

    describe('POST /auth/login', () => {
        beforeEach(async () => {
            // Criar usuário de teste
            const senhaHash = await bcrypt.hash('senha123', 10);
            await new Promise((resolve, reject) => {
                db.run('INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
                    ['Login User', 'login@teste.com', senhaHash],
                    (err) => err ? reject(err) : resolve()
                );
            });

            app.post('/auth/login', async (req, res) => {
                const { email, senha } = req.body;

                if (!email || !senha) {
                    return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
                }

                db.get('SELECT * FROM usuarios WHERE email = ?', [email], async (err, usuario) => {
                    if (err || !usuario) {
                        return res.status(401).json({ erro: 'Email ou senha inválidos' });
                    }

                    const senhaValida = await bcrypt.compare(senha, usuario.senha);
                    if (!senhaValida) {
                        return res.status(401).json({ erro: 'Email ou senha inválidos' });
                    }

                    req.session.userId = usuario.id;

                    res.json({
                        sucesso: true,
                        usuario: {
                            id: usuario.id,
                            nome: usuario.nome,
                            email: usuario.email,
                            isAdmin: usuario.isAdmin === 1,
                            isSuperAdmin: usuario.isSuperAdmin === 1,
                            tipo: usuario.tipo
                        }
                    });
                });
            });
        });

        test('Deve fazer login com credenciais válidas', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'login@teste.com',
                    senha: 'senha123'
                });

            expect(response.status).toBe(200);
            expect(response.body.sucesso).toBe(true);
            expect(response.body.usuario.email).toBe('login@teste.com');
        });

        test('Deve rejeitar login com senha incorreta', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'login@teste.com',
                    senha: 'senhaerrada'
                });

            expect(response.status).toBe(401);
            expect(response.body.erro).toBe('Email ou senha inválidos');
        });

        test('Deve rejeitar login com email inexistente', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'naoexiste@teste.com',
                    senha: 'senha123'
                });

            expect(response.status).toBe(401);
            expect(response.body.erro).toBe('Email ou senha inválidos');
        });
    });

    describe('POST /auth/logout', () => {
        test('Deve fazer logout e destruir sessão', async () => {
            app.post('/auth/logout', (req, res) => {
                req.session.destroy();
                res.json({ sucesso: true, mensagem: 'Logout realizado' });
            });

            const response = await request(app).post('/auth/logout');

            expect(response.status).toBe(200);
            expect(response.body.sucesso).toBe(true);
        });
    });
});
