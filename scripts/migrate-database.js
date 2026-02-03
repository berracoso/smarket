/**
 * Migração do Banco de Dados - Histórico de Apostas
 * 
 * ANTES: Um único evento, apostas deletadas ao resetar
 * DEPOIS: Múltiplos eventos, histórico preservado
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../bolao.db');
const db = new sqlite3.Database(dbPath);

console.log('🔄 Iniciando migração do banco de dados...\n');

db.serialize(() => {
    // 1. Criar tabela de eventos históricos
    console.log('📋 Criando tabela eventos_historico...');
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
            console.error('❌ Erro ao criar eventos_historico:', err.message);
        } else {
            console.log('✅ Tabela eventos_historico criada');
        }
    });

    // 2. Adicionar campo eventoId na tabela apostas (se não existir)
    console.log('\n📋 Adicionando campo eventoId em apostas...');
    db.run(`ALTER TABLE apostas ADD COLUMN eventoId INTEGER`, (err) => {
        if (err && !err.message.includes('duplicate column')) {
            console.error('❌ Erro:', err.message);
        } else {
            console.log('✅ Campo eventoId adicionado (ou já existia)');
        }
    });

    // 3. Migrar evento atual para eventos_historico
    console.log('\n📋 Migrando evento atual...');
    db.get('SELECT * FROM evento WHERE id = ?', ['evento-1'], (err, eventoAtual) => {
        if (eventoAtual) {
            db.run(`INSERT OR IGNORE INTO eventos_historico (codigo, nome, times, aberto, vencedor, status) 
                    VALUES (?, ?, ?, ?, ?, ?)`,
                ['evento-1', 'Evento Inicial', eventoAtual.times, eventoAtual.aberto, eventoAtual.vencedor, 'ativo'],
                function (err) {
                    if (err) {
                        console.error('❌ Erro ao migrar evento:', err.message);
                    } else {
                        const eventoHistoricoId = this.lastID;
                        console.log(`✅ Evento migrado com ID: ${eventoHistoricoId}`);

                        // 4. Atualizar apostas existentes com eventoId
                        console.log('\n📋 Vinculando apostas existentes ao evento...');
                        db.run(`UPDATE apostas SET eventoId = ? WHERE eventoId IS NULL`,
                            [eventoHistoricoId],
                            (err) => {
                                if (err) {
                                    console.error('❌ Erro ao vincular apostas:', err.message);
                                } else {
                                    console.log('✅ Apostas vinculadas ao evento');
                                }
                            }
                        );
                    }
                }
            );
        } else {
            console.log('⚠️  Nenhum evento encontrado para migrar');
        }
    });

    // 5. Criar índices para performance
    console.log('\n📋 Criando índices para otimização...');

    db.run(`CREATE INDEX IF NOT EXISTS idx_apostas_eventoId ON apostas(eventoId)`, (err) => {
        if (err) {
            console.error('❌ Erro ao criar índice idx_apostas_eventoId:', err.message);
        } else {
            console.log('✅ Índice idx_apostas_eventoId criado');
        }
    });

    db.run(`CREATE INDEX IF NOT EXISTS idx_apostas_userId ON apostas(userId)`, (err) => {
        if (err) {
            console.error('❌ Erro ao criar índice idx_apostas_userId:', err.message);
        } else {
            console.log('✅ Índice idx_apostas_userId criado');
        }
    });

    db.run(`CREATE INDEX IF NOT EXISTS idx_apostas_timestamp ON apostas(timestamp)`, (err) => {
        if (err) {
            console.error('❌ Erro ao criar índice idx_apostas_timestamp:', err.message);
        } else {
            console.log('✅ Índice idx_apostas_timestamp criado');
        }
    });

    db.run(`CREATE INDEX IF NOT EXISTS idx_eventos_status ON eventos_historico(status)`, (err) => {
        if (err) {
            console.error('❌ Erro ao criar índice idx_eventos_status:', err.message);
        } else {
            console.log('✅ Índice idx_eventos_status criado');
        }
    });

    // 6. Resumo final
    setTimeout(() => {
        console.log('\n' + '='.repeat(50));
        console.log('📊 RESUMO DA MIGRAÇÃO\n');

        db.get('SELECT COUNT(*) as total FROM eventos_historico', (err, row) => {
            console.log(`✅ Eventos no histórico: ${row?.total || 0}`);
        });

        db.get('SELECT COUNT(*) as total FROM apostas WHERE eventoId IS NOT NULL', (err, row) => {
            console.log(`✅ Apostas vinculadas: ${row?.total || 0}`);
        });

        db.get('SELECT COUNT(*) as total FROM apostas WHERE eventoId IS NULL', (err, row) => {
            console.log(`⚠️  Apostas não vinculadas: ${row?.total || 0}`);
        });

        setTimeout(() => {
            console.log('\n✅ Migração concluída com sucesso!');
            console.log('='.repeat(50) + '\n');
            db.close();
        }, 500);
    }, 1000);
});
