const getDbConnection = require('../src/infrastructure/database/sqlite');

async function setupDatabase() {
    try {
        const db = await getDbConnection();

        console.log('Criando tabelas...');

        await db.exec(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id TEXT PRIMARY KEY,
                nome TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                senha TEXT NOT NULL,
                isAdmin INTEGER DEFAULT 0,
                isSuperAdmin INTEGER DEFAULT 0,
                tipo TEXT NOT NULL,
                criadoEm TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS eventos (
                id TEXT PRIMARY KEY,
                codigo TEXT UNIQUE NOT NULL,
                nome TEXT NOT NULL,
                times TEXT NOT NULL, -- Será armazenado como JSON string
                aberto INTEGER DEFAULT 1,
                vencedor TEXT,
                status TEXT NOT NULL,
                criadoEm TEXT NOT NULL,
                finalizadoEm TEXT
            );

            CREATE TABLE IF NOT EXISTS apostas (
                id TEXT PRIMARY KEY,
                userId TEXT NOT NULL,
                eventoId TEXT NOT NULL,
                nome TEXT NOT NULL,
                time TEXT NOT NULL,
                valor REAL NOT NULL,
                timestamp TEXT NOT NULL,
                FOREIGN KEY (userId) REFERENCES usuarios (id),
                FOREIGN KEY (eventoId) REFERENCES eventos (id)
            );
        `);

        console.log('Tabelas criadas com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('Erro ao configurar banco de dados:', error);
        process.exit(1);
    }
}

setupDatabase();