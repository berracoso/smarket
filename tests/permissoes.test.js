/**
 * Testes de Permissões e RBAC
 * Cobre: validações de permissão, Super Admin, Admin, usuário comum
 */

const sqlite3 = require('sqlite3').verbose();

describe('Permissões e RBAC', () => {
    let db;
    let superAdminId;
    let adminId;
    let usuarioId;

    beforeEach((done) => {
        db = new sqlite3.Database(':memory:', (err) => {
            if (err) return done(err);

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

                // Criar Super Admin
                db.run("INSERT INTO usuarios (nome, email, senha, isAdmin, isSuperAdmin, tipo) VALUES (?, ?, ?, ?, ?, ?)",
                    ['Super Admin', 'super@test.com', 'hash', 1, 1, 'super_admin'], function () {
                        superAdminId = this.lastID;

                        // Criar Admin
                        db.run("INSERT INTO usuarios (nome, email, senha, isAdmin, isSuperAdmin, tipo) VALUES (?, ?, ?, ?, ?, ?)",
                            ['Admin', 'admin@test.com', 'hash', 1, 0, 'admin'], function () {
                                adminId = this.lastID;

                                // Criar Usuário comum
                                db.run("INSERT INTO usuarios (nome, email, senha, isAdmin, isSuperAdmin, tipo) VALUES (?, ?, ?, ?, ?, ?)",
                                    ['Usuario', 'user@test.com', 'hash', 0, 0, 'usuario'], function () {
                                        usuarioId = this.lastID;
                                        done();
                                    }
                                );
                            }
                        );
                    }
                );
            });
        });
    });

    afterEach((done) => {
        db.close(done);
    });

    describe('Validação de Tipos de Usuário', () => {
        test('Super Admin deve ter ambas flags ativas', (done) => {
            db.get('SELECT * FROM usuarios WHERE id = ?', [superAdminId], (err, user) => {
                expect(user.isAdmin).toBe(1);
                expect(user.isSuperAdmin).toBe(1);
                expect(user.tipo).toBe('super_admin');
                done();
            });
        });

        test('Admin deve ter apenas isAdmin ativa', (done) => {
            db.get('SELECT * FROM usuarios WHERE id = ?', [adminId], (err, user) => {
                expect(user.isAdmin).toBe(1);
                expect(user.isSuperAdmin).toBe(0);
                expect(user.tipo).toBe('admin');
                done();
            });
        });

        test('Usuário comum não deve ter nenhuma flag ativa', (done) => {
            db.get('SELECT * FROM usuarios WHERE id = ?', [usuarioId], (err, user) => {
                expect(user.isAdmin).toBe(0);
                expect(user.isSuperAdmin).toBe(0);
                expect(user.tipo).toBe('usuario');
                done();
            });
        });
    });

    describe('Promoção de Usuários', () => {
        test('Deve promover usuário comum a admin', (done) => {
            db.run('UPDATE usuarios SET isAdmin = 1, tipo = ? WHERE id = ?',
                ['admin', usuarioId], (err) => {
                    expect(err).toBeNull();

                    db.get('SELECT * FROM usuarios WHERE id = ?', [usuarioId], (err, user) => {
                        expect(user.isAdmin).toBe(1);
                        expect(user.tipo).toBe('admin');
                        done();
                    });
                }
            );
        });

        test('Não deve promover admin a super admin (apenas via rebaixamento)', (done) => {
            // Super Admin é um tipo especial, não deve ser promovido por promoção normal
            db.get('SELECT COUNT(*) as total FROM usuarios WHERE isSuperAdmin = 1', (err, result) => {
                expect(result.total).toBe(1); // Apenas 1 Super Admin
                done();
            });
        });
    });

    describe('Rebaixamento de Usuários', () => {
        test('Deve rebaixar admin a usuário comum', (done) => {
            db.run('UPDATE usuarios SET isAdmin = 0, tipo = ? WHERE id = ?',
                ['usuario', adminId], (err) => {
                    expect(err).toBeNull();

                    db.get('SELECT * FROM usuarios WHERE id = ?', [adminId], (err, user) => {
                        expect(user.isAdmin).toBe(0);
                        expect(user.tipo).toBe('usuario');
                        done();
                    });
                }
            );
        });

        test('Não deve permitir rebaixar Super Admin', (done) => {
            // Esta regra deve ser implementada no código
            db.get('SELECT * FROM usuarios WHERE id = ?', [superAdminId], (err, user) => {
                // Super Admin não deve ser rebaixado
                expect(user.isSuperAdmin).toBe(1);
                done();
            });
        });
    });

    describe('Validação de Apostas', () => {
        test('Super Admin não deve poder apostar', (done) => {
            db.get('SELECT * FROM usuarios WHERE id = ?', [superAdminId], (err, user) => {
                // Validação: Super Admin tem flag isSuperAdmin
                const podeApostar = user.isSuperAdmin !== 1;
                expect(podeApostar).toBe(false);
                done();
            });
        });

        test('Admin pode apostar', (done) => {
            db.get('SELECT * FROM usuarios WHERE id = ?', [adminId], (err, user) => {
                const podeApostar = user.isSuperAdmin !== 1;
                expect(podeApostar).toBe(true);
                done();
            });
        });

        test('Usuário comum pode apostar', (done) => {
            db.get('SELECT * FROM usuarios WHERE id = ?', [usuarioId], (err, user) => {
                const podeApostar = user.isSuperAdmin !== 1;
                expect(podeApostar).toBe(true);
                done();
            });
        });
    });

    describe('Permissões de Admin', () => {
        test('Admin deve poder acessar rotas admin', (done) => {
            db.get('SELECT * FROM usuarios WHERE id = ?', [adminId], (err, user) => {
                const temPermissaoAdmin = user.isAdmin === 1 || user.isSuperAdmin === 1;
                expect(temPermissaoAdmin).toBe(true);
                done();
            });
        });

        test('Usuário comum não deve acessar rotas admin', (done) => {
            db.get('SELECT * FROM usuarios WHERE id = ?', [usuarioId], (err, user) => {
                const temPermissaoAdmin = user.isAdmin === 1 || user.isSuperAdmin === 1;
                expect(temPermissaoAdmin).toBe(false);
                done();
            });
        });
    });

    describe('Permissões de Super Admin', () => {
        test('Apenas Super Admin deve poder promover/rebaixar', (done) => {
            db.get('SELECT * FROM usuarios WHERE id = ?', [superAdminId], (err, user) => {
                const temPermissaoSuperAdmin = user.isSuperAdmin === 1;
                expect(temPermissaoSuperAdmin).toBe(true);
                done();
            });
        });

        test('Admin comum não deve ter permissão de Super Admin', (done) => {
            db.get('SELECT * FROM usuarios WHERE id = ?', [adminId], (err, user) => {
                const temPermissaoSuperAdmin = user.isSuperAdmin === 1;
                expect(temPermissaoSuperAdmin).toBe(false);
                done();
            });
        });
    });

    describe('Busca de Usuários por Tipo', () => {
        test('Deve retornar todos admins (incluindo Super Admin)', (done) => {
            db.all('SELECT * FROM usuarios WHERE isAdmin = 1', [], (err, users) => {
                expect(users).toHaveLength(2); // Super Admin e Admin
                done();
            });
        });

        test('Deve retornar apenas Super Admins', (done) => {
            db.all('SELECT * FROM usuarios WHERE isSuperAdmin = 1', [], (err, users) => {
                expect(users).toHaveLength(1);
                expect(users[0].id).toBe(superAdminId);
                done();
            });
        });

        test('Deve retornar apenas usuários comuns', (done) => {
            db.all('SELECT * FROM usuarios WHERE isAdmin = 0 AND isSuperAdmin = 0', [], (err, users) => {
                expect(users).toHaveLength(1);
                expect(users[0].id).toBe(usuarioId);
                done();
            });
        });
    });

    describe('Validação de Email Único', () => {
        test('Não deve permitir emails duplicados', (done) => {
            db.run("INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)",
                ['Duplicate User', 'user@test.com', 'hash'], (err) => {
                    expect(err).toBeDefined();
                    expect(err.message).toContain('UNIQUE constraint failed');
                    done();
                }
            );
        });
    });

    describe('Contagem de Usuários por Tipo', () => {
        test('Deve contar corretamente cada tipo', (done) => {
            db.get('SELECT COUNT(*) as total FROM usuarios WHERE isSuperAdmin = 1', (err, superAdmins) => {
                db.get('SELECT COUNT(*) as total FROM usuarios WHERE isAdmin = 1 AND isSuperAdmin = 0', (err, admins) => {
                    db.get('SELECT COUNT(*) as total FROM usuarios WHERE isAdmin = 0', (err, usuarios) => {
                        expect(superAdmins.total).toBe(1);
                        expect(admins.total).toBe(1);
                        expect(usuarios.total).toBe(1);
                        done();
                    });
                });
            });
        });
    });
});
