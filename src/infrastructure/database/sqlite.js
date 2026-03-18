const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

// Caminho absoluto para a raiz do projeto
const dbPath = path.resolve(__dirname, '../../../../smarket.db');

// Implementação Singleton para evitar "database is locked"
let dbInstance = null;

async function getDbConnection() {
    if (dbInstance) {
        return dbInstance;
    }

    dbInstance = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // Habilita chaves estrangeiras no SQLite
    await dbInstance.exec('PRAGMA foreign_keys = ON;');

    console.log(`[SQLite] Conectado ao banco físico em: ${dbPath}`);
    return dbInstance;
}

module.exports = getDbConnection;