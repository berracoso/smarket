const crypto = require('crypto');
const getDbConnection = require('../src/infrastructure/database/sqlite');
const BcryptHasher = require('../src/infrastructure/security/BcryptHasher');

async function setupDatabase() {
    try {
        const db = await getDbConnection();
        const hasher = new BcryptHasher();

        console.log('Verificando tabelas do banco de dados...');

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
                times TEXT NOT NULL,
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

        console.log('Tabelas configuradas com sucesso!');

        // --- INJEÇÃO/ATUALIZAÇÃO AUTOMÁTICA DO SUPER ADMIN ---
        const emailAdmin = 'admsuper@bolao.com';
        const senhaPlana = 'Admin@202266'; // <-- NOVA SENHA APLICADA AQUI
        
        const adminExistente = await db.get('SELECT id FROM usuarios WHERE email = ?', [emailAdmin]);
        const senhaHash = await hasher.hash(senhaPlana);
        
        if (!adminExistente) {
            console.log('Criando conta mestre de Super Admin...');
            
            const id = crypto.randomUUID();
            const criadoEm = new Date().toISOString();

            await db.run(
                `INSERT INTO usuarios (id, nome, email, senha, isAdmin, isSuperAdmin, tipo, criadoEm) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [id, 'Super Admin', emailAdmin, senhaHash, 1, 1, 'superadmin', criadoEm]
            );
            
            console.log(`✅ CONTA MESTRE CRIADA COM SUCESSO!`);
        } else {
            // Se a conta já existe (por causa do script anterior), atualiza a senha para a nova
            await db.run('UPDATE usuarios SET senha = ? WHERE email = ?', [senhaHash, emailAdmin]);
            console.log(`✅ A senha da conta Super Admin (${emailAdmin}) foi atualizada!`);
        }

        console.log(`📧 E-mail: ${emailAdmin}`);
        console.log(`🔑 Senha: ${senhaPlana}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao configurar banco de dados:', error);
        process.exit(1);
    }
}

setupDatabase();