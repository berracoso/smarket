/**
 * Testes de Integração - SQLiteUsuarioRepository
 * Usa banco SQLite em memória para testes
 */

const SQLiteUsuarioRepository = require('../../../../src/infrastructure/repositories/SQLiteUsuarioRepository');
const Usuario = require('../../../../src/domain/entities/Usuario');
const Email = require('../../../../src/domain/value-objects/Email');
const sqlite3 = require('sqlite3').verbose();

describe('Integração: SQLiteUsuarioRepository', () => {
    let db;
    let repository;

    beforeEach((done) => {
        // Cria banco em memória para cada teste
        db = new sqlite3.Database(':memory:');
        
        // Cria tabela usuarios
        db.run(`
            CREATE TABLE usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                senha TEXT NOT NULL,
                isAdmin INTEGER DEFAULT 0,
                isSuperAdmin INTEGER DEFAULT 0,
                tipo TEXT DEFAULT 'usuario',
                criadoEm TEXT DEFAULT (datetime('now'))
            )
        `, (err) => {
            if (err) done(err);
            
            // Cria mock do database com métodos promise
            const dbMock = {
                run: (sql, params) => new Promise((resolve, reject) => {
                    db.run(sql, params, function(err) {
                        if (err) reject(err);
                        else resolve({ lastID: this.lastID, changes: this.changes });
                    });
                }),
                get: (sql, params) => new Promise((resolve, reject) => {
                    db.get(sql, params, (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
                }),
                all: (sql, params) => new Promise((resolve, reject) => {
                    db.all(sql, params, (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows || []);
                    });
                })
            };

            repository = new SQLiteUsuarioRepository(dbMock);
            done();
        });
    });

    afterEach((done) => {
        db.close(done);
    });

    describe('criar()', () => {
        test('Deve criar usuário e retornar ID', async () => {
            const usuario = new Usuario({
                nome: 'João Silva',
                email: 'joao@teste.com',
                senha: 'hashedpassword123'
            });

            const id = await repository.criar(usuario);
            
            expect(id).toBe(1);
            expect(typeof id).toBe('number');
        });

        test('Deve criar admin corretamente', async () => {
            const admin = new Usuario({
                nome: 'Admin User',
                email: 'admin@teste.com',
                senha: 'hash123',
                isAdmin: true
            });

            const id = await repository.criar(admin);
            const usuarioBuscado = await repository.buscarPorId(id);

            expect(usuarioBuscado.isAdmin).toBe(true);
            expect(usuarioBuscado.tipo).toBe('admin');
        });

        test('Deve criar super admin corretamente', async () => {
            const superAdmin = new Usuario({
                nome: 'Super Admin',
                email: 'super@teste.com',
                senha: 'hash123',
                isSuperAdmin: true
            });

            const id = await repository.criar(superAdmin);
            const usuarioBuscado = await repository.buscarPorId(id);

            expect(usuarioBuscado.isSuperAdmin).toBe(true);
            expect(usuarioBuscado.tipo).toBe('superadmin');
        });
    });

    describe('buscarPorId()', () => {
        test('Deve buscar usuário existente', async () => {
            const usuario = new Usuario({
                nome: 'Maria Santos',
                email: 'maria@teste.com',
                senha: 'hash456'
            });

            const id = await repository.criar(usuario);
            const usuarioBuscado = await repository.buscarPorId(id);

            expect(usuarioBuscado).toBeInstanceOf(Usuario);
            expect(usuarioBuscado.nome).toBe('Maria Santos');
            expect(usuarioBuscado.email.toString()).toBe('maria@teste.com');
        });

        test('Deve retornar null para ID inexistente', async () => {
            const usuario = await repository.buscarPorId(999);
            expect(usuario).toBeNull();
        });
    });

    describe('buscarPorEmail()', () => {
        test('Deve buscar usuário por email', async () => {
            const usuario = new Usuario({
                nome: 'Pedro Costa',
                email: 'pedro@teste.com',
                senha: 'hash789'
            });

            await repository.criar(usuario);
            const usuarioBuscado = await repository.buscarPorEmail('pedro@teste.com');

            expect(usuarioBuscado).toBeInstanceOf(Usuario);
            expect(usuarioBuscado.nome).toBe('Pedro Costa');
        });

        test('Deve buscar ignorando case do email', async () => {
            const usuario = new Usuario({
                nome: 'Ana Lima',
                email: 'ana@teste.com',
                senha: 'hash000'
            });

            await repository.criar(usuario);
            const usuarioBuscado = await repository.buscarPorEmail('ANA@TESTE.COM');

            expect(usuarioBuscado).toBeInstanceOf(Usuario);
            expect(usuarioBuscado.email.toString()).toBe('ana@teste.com');
        });

        test('Deve retornar null para email inexistente', async () => {
            const usuario = await repository.buscarPorEmail('naoexiste@teste.com');
            expect(usuario).toBeNull();
        });
    });

    describe('atualizar()', () => {
        test('Deve atualizar dados do usuário', async () => {
            const usuario = new Usuario({
                nome: 'Carlos Souza',
                email: 'carlos@teste.com',
                senha: 'hash111'
            });

            const id = await repository.criar(usuario);
            const usuarioBuscado = await repository.buscarPorId(id);
            
            usuarioBuscado.promoverParaAdmin();
            const atualizado = await repository.atualizar(usuarioBuscado);

            expect(atualizado).toBe(true);

            const usuarioVerificado = await repository.buscarPorId(id);
            expect(usuarioVerificado.isAdmin).toBe(true);
        });

        test('Deve retornar false para usuário inexistente', async () => {
            const usuario = new Usuario({
                id: 999,
                nome: 'Inexistente',
                email: 'nao@existe.com',
                senha: 'hash'
            });

            const atualizado = await repository.atualizar(usuario);
            expect(atualizado).toBe(false);
        });
    });

    describe('listarTodos()', () => {
        test('Deve listar todos os usuários', async () => {
            await repository.criar(new Usuario({ nome: 'User 1', email: 'user1@teste.com', senha: 'hash1' }));
            await repository.criar(new Usuario({ nome: 'User 2', email: 'user2@teste.com', senha: 'hash2' }));
            await repository.criar(new Usuario({ nome: 'User 3', email: 'user3@teste.com', senha: 'hash3' }));

            const usuarios = await repository.listarTodos();

            expect(usuarios).toHaveLength(3);
            expect(usuarios[0]).toBeInstanceOf(Usuario);
        });

        test('Deve retornar array vazio quando não há usuários', async () => {
            const usuarios = await repository.listarTodos();
            expect(usuarios).toHaveLength(0);
        });
    });

    describe('excluir()', () => {
        test('Deve excluir usuário existente', async () => {
            const usuario = new Usuario({
                nome: 'Para Excluir',
                email: 'excluir@teste.com',
                senha: 'hash'
            });

            const id = await repository.criar(usuario);
            const excluido = await repository.excluir(id);

            expect(excluido).toBe(true);

            const usuarioBuscado = await repository.buscarPorId(id);
            expect(usuarioBuscado).toBeNull();
        });

        test('Deve retornar false para usuário inexistente', async () => {
            const excluido = await repository.excluir(999);
            expect(excluido).toBe(false);
        });
    });
});
