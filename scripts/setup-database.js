/**
 * Script de Inicialização do Banco de Dados
 * Cria tabelas e usuário admin padrão
 */

require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../bolao.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Inicializando banco de dados...\n');

db.serialize(() => {
    // Criar tabela de usuários
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        isAdmin INTEGER DEFAULT 0,
        isSuperAdmin INTEGER DEFAULT 0,
        tipo TEXT DEFAULT 'usuario',
        criadoEm TEXT DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('❌ Erro ao criar tabela usuarios:', err);
        } else {
            console.log('✅ Tabela usuarios criada');
        }
    });

    // Criar tabela de apostas
    db.run(`CREATE TABLE IF NOT EXISTS apostas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        eventoId INTEGER,
        nome TEXT NOT NULL,
        time TEXT NOT NULL,
        valor REAL NOT NULL,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        ganhou INTEGER DEFAULT 0,
        lucroReal REAL DEFAULT 0,
        FOREIGN KEY (userId) REFERENCES usuarios(id),
        FOREIGN KEY (eventoId) REFERENCES eventos_historico(id)
    )`, (err) => {
        if (err) {
            console.error('❌ Erro ao criar tabela apostas:', err);
        } else {
            console.log('✅ Tabela apostas criada');
        }
    });

    // Criar tabela de eventos históricos
    db.run(`CREATE TABLE IF NOT EXISTS eventos_historico (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT UNIQUE NOT NULL,
        nome TEXT NOT NULL,
        times TEXT NOT NULL,
        aberto INTEGER DEFAULT 1,
        vencedor TEXT,
        criadoEm TEXT DEFAULT CURRENT_TIMESTAMP,
        finalizadoEm TEXT,
        status TEXT DEFAULT 'ativo'
    )`, (err) => {
        if (err) {
            console.error('❌ Erro ao criar tabela eventos_historico:', err);
        } else {
            console.log('✅ Tabela eventos_historico criada');
        }
    });

    // Criar tabela de evento legado (compatibilidade)
    db.run(`CREATE TABLE IF NOT EXISTS evento (
        id TEXT PRIMARY KEY,
        times TEXT NOT NULL,
        aberto INTEGER DEFAULT 1,
        vencedor TEXT
    )`, (err) => {
        if (err) {
            console.error('❌ Erro ao criar tabela evento:', err);
        } else {
            console.log('✅ Tabela evento criada');
        }
    });

    // Criar índices para performance
    db.run(`CREATE INDEX IF NOT EXISTS idx_apostas_eventoId ON apostas(eventoId)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_apostas_userId ON apostas(userId)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_apostas_timestamp ON apostas(timestamp)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_eventos_status ON eventos_historico(status)`);
    console.log('✅ Índices criados');

    // Verificar se já existe um Super Admin
    db.get('SELECT * FROM usuarios WHERE isSuperAdmin = 1', (err, row) => {
        if (err) {
            console.error('❌ Erro ao verificar admin:', err);
            db.close();
            return;
        }

        if (!row) {
            // Criar Super Admin padrão usando credenciais do .env
            const adminEmail = process.env.ADMIN_EMAIL || 'admin@bolao.com';
            const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@202266';
            const senhaHash = bcrypt.hashSync(adminPassword, 10);

            db.run(`INSERT INTO usuarios (nome, email, senha, isAdmin, isSuperAdmin, tipo) 
                    VALUES (?, ?, ?, 1, 1, 'superadmin')`,
                ['Super Administrador', adminEmail, senhaHash],
                (err) => {
                    if (err) {
                        console.error('❌ Erro ao criar Super Admin:', err.message);
                    } else {
                        console.log('\n✅ Super Admin criado com sucesso!');
                        console.log(`   Email: ${adminEmail}`);
                        console.log(`   Senha: ${adminPassword}`);
                    }

                    // Criar evento padrão
                    criarEventoPadrao();
                }
            );
        } else {
            console.log('\n✅ Super Admin já existe');
            criarEventoPadrao();
        }
    });

    function criarEventoPadrao() {
        // Verificar se já existe evento ativo na tabela eventos_historico
        db.get('SELECT * FROM eventos_historico WHERE status = ?', ['ativo'], (err, row) => {
            if (!row) {
                // Criar evento ativo na tabela nova
                const codigo = `evento-${Date.now()}`;
                const nome = `Evento ${new Date().toLocaleDateString('pt-BR')}`;
                const timesJson = JSON.stringify(['Time A', 'Time B', 'Time C', 'Time D']);

                db.run(`INSERT INTO eventos_historico (codigo, nome, times, aberto, status) 
                        VALUES (?, ?, ?, 1, 'ativo')`,
                    [codigo, nome, timesJson],
                    (err) => {
                        if (err) {
                            console.error('❌ Erro ao criar evento ativo:', err);
                        } else {
                            console.log('✅ Evento ativo criado na tabela eventos_historico');
                        }

                        // Também criar na tabela legada para compatibilidade
                        criarEventoLegacy();
                    }
                );
            } else {
                console.log('✅ Evento ativo já existe');
                criarEventoLegacy();
            }
        });
    }

    function criarEventoLegacy() {
        // Verificar se já existe evento legado
        db.get('SELECT * FROM evento WHERE id = ?', ['evento-1'], (err, row) => {
            if (!row) {
                const timesJson = JSON.stringify(['Time A', 'Time B', 'Time C', 'Time D']);
                db.run(`INSERT INTO evento (id, times, aberto, vencedor) VALUES (?, ?, 1, NULL)`,
                    ['evento-1', timesJson],
                    (err) => {
                        if (err) {
                            console.error('❌ Erro ao criar evento padrão:', err);
                        } else {
                            console.log('✅ Evento legado criado');
                        }
                        finalizarSetup();
                    }
                );
            } else {
                console.log('✅ Evento legado já existe');
                finalizarSetup();
            }
        });
    }

    function finalizarSetup() {
        console.log('\n🎉 Banco de dados inicializado com sucesso!');
        console.log('\n📝 Você pode agora:');
        console.log('   1. Iniciar o servidor: npm start');
        console.log(`   2. Fazer login com: ${process.env.ADMIN_EMAIL || 'admin@bolao.com'} / ${process.env.ADMIN_PASSWORD || 'Admin@202266'}`);
        console.log('   3. Ou registrar um novo usuário\n');

        db.close((err) => {
            if (err) {
                console.error('❌ Erro ao fechar banco:', err);
            }
        });
    }
});
