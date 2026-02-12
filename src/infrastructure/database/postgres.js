const { Pool } = require('pg');

class PostgresConnection {
    constructor() {
        // Validação estrita de ambiente
        if (!process.env.DATABASE_URL) {
            console.error('❌ ERRO CRÍTICO: DATABASE_URL não está definida nas variáveis de ambiente.');
            console.error('   Verifique seu arquivo .env ou as configurações do Render/Railway.');
            // Em produção, é melhor encerrar o processo do que rodar quebrado
            if (process.env.NODE_ENV === 'production') {
                process.exit(1);
            }
        }

        const config = {
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' 
                ? { rejectUnauthorized: false } 
                : false
        };

        // Adiciona configuração de idleTimeout para evitar conexões "penduradas" no Render
        if (process.env.NODE_ENV === 'production') {
            config.idleTimeoutMillis = 30000;
            config.connectionTimeoutMillis = 2000;
        }

        this.pool = new Pool(config);

        this.pool.on('error', (err) => {
            console.error('❌ Erro inesperado no cliente Postgres (Pool Error)', err);
            // Não dê throw aqui, pois pode derrubar o servidor em erros transitórios
        });
    }

    async query(sql, params = []) {
        try {
            return await this.pool.query(sql, params);
        } catch (error) {
            console.error(`❌ Erro na Query SQL: ${sql}`);
            console.error(`   Params: ${JSON.stringify(params)}`);
            throw error;
        }
    }

    async close() {
        await this.pool.end();
    }
}

module.exports = new PostgresConnection();