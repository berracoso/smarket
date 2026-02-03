/**
 * Singleton para conexão com SQLite
 * Gerencia a conexão única com o banco de dados
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class SQLiteConnection {
    constructor() {
        this.db = null;
        this.dbPath = path.resolve(__dirname, '../../../bolao.db');
    }

    /**
     * Obtém a conexão com o banco (Singleton)
     * @returns {sqlite3.Database}
     */
    getConnection() {
        if (!this.db) {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Erro ao conectar ao SQLite:', err);
                    throw err;
                }
                console.log('✅ Conectado ao banco SQLite');
            });

            // Habilitar foreign keys
            this.db.run('PRAGMA foreign_keys = ON');
        }
        return this.db;
    }

    /**
     * Fecha a conexão com o banco
     */
    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Erro ao fechar banco:', err);
                }
                this.db = null;
            });
        }
    }

    /**
     * Executa uma query com parâmetros
     * @param {string} sql 
     * @param {Array} params 
     * @returns {Promise<any>}
     */
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.getConnection().run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ lastID: this.lastID, changes: this.changes });
            });
        });
    }

    /**
     * Busca uma única linha
     * @param {string} sql 
     * @param {Array} params 
     * @returns {Promise<any>}
     */
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.getConnection().get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    /**
     * Busca múltiplas linhas
     * @param {string} sql 
     * @param {Array} params 
     * @returns {Promise<Array>}
     */
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.getConnection().all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }
}

// Exportar instância única (Singleton)
module.exports = new SQLiteConnection();
