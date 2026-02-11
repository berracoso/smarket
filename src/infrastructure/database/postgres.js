/**
 * Conexão com PostgreSQL (Substitui sqlite.js)
 */
const { Pool } = require('pg');

class PostgresConnection {
    constructor() {
        // Na Railway/Render a variável é DATABASE_URL
        // Localmente você pode criar um .env com DATABASE_URL=postgres://user:pass@localhost:5432/bolao
        if (!process.env.DATABASE_URL) {
            console.warn('⚠️  DATABASE_URL não definida. O app vai falhar se tentar conectar.');
        }

        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            // Necessário para conexões seguras na nuvem (Render/Railway)
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        this.pool.on('error', (err) => {
            console.error('❌ Erro inesperado no cliente Postgres', err);
        });
    }

    /**
     * Executa queries (Compatível com a interface do SQLite que usávamos)
     */
    async query(sql, params = []) {
        try {
            return await this.pool.query(sql, params);
        } catch (error) {
            console.error(`Erro na Query: ${sql}`, error);
            throw error;
        }
    }

    async close() {
        await this.pool.end();
    }
}

module.exports = new PostgresConnection();