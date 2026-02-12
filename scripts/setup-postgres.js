/**
 * Script de Inicialização do Banco de Dados PostgreSQL
 */
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

if (!process.env.DATABASE_URL) {
    console.error('❌ ERRO CRÍTICO: DATABASE_URL não definida.');
    console.error('👉 No Render: Vá em Environment e adicione DATABASE_URL com a Internal URL do seu Postgres.');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function setup() {
    try {
        console.log('🔧 Inicializando PostgreSQL...');
        await pool.query('SELECT 1'); 

        // 1. Tabela Usuarios
        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                nome TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                senha TEXT NOT NULL,
                isAdmin INTEGER DEFAULT 0,
                isSuperAdmin INTEGER DEFAULT 0,
                tipo TEXT DEFAULT 'usuario',
                criadoEm TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Tabela usuarios verificada');

        // 2. Tabela Eventos
        await pool.query(`
            CREATE TABLE IF NOT EXISTS eventos_historico (
                id SERIAL PRIMARY KEY,
                codigo TEXT UNIQUE NOT NULL,
                nome TEXT NOT NULL,
                times TEXT NOT NULL,
                aberto INTEGER DEFAULT 1,
                vencedor TEXT,
                status TEXT DEFAULT 'ativo',
                criadoEm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                finalizadoEm TIMESTAMP
            );
        `);
        console.log('✅ Tabela eventos_historico verificada');

        // 3. Tabela Apostas
        await pool.query(`
            CREATE TABLE IF NOT EXISTS apostas (
                id SERIAL PRIMARY KEY,
                userId INTEGER NOT NULL,
                eventoId INTEGER,
                nome TEXT NOT NULL,
                time TEXT NOT NULL,
                valor NUMERIC(10,2) NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ganhou INTEGER DEFAULT 0,
                lucroReal NUMERIC(10,2) DEFAULT 0,
                FOREIGN KEY (userId) REFERENCES usuarios(id),
                FOREIGN KEY (eventoId) REFERENCES eventos_historico(id)
            );
        `);
        console.log('✅ Tabela apostas verificada');

        // 4. Criar Super Admin (CORREÇÃO: Normalizar email para minúsculo)
        const rawAdminEmail = process.env.ADMIN_EMAIL || 'admin@bolao.com';
        const adminEmail = rawAdminEmail.toLowerCase().trim();
        
        const res = await pool.query('SELECT * FROM usuarios WHERE email = $1', [adminEmail]);
        
        if (res.rows.length === 0) {
            const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@202266';
            const senhaHash = bcrypt.hashSync(adminPassword, 10);
            
            await pool.query(`
                INSERT INTO usuarios (nome, email, senha, isAdmin, isSuperAdmin, tipo)
                VALUES ($1, $2, $3, 1, 1, 'superadmin')
            `, ['Super Administrador', adminEmail, senhaHash]);
            
            console.log(`\n👑 Super Admin criado: ${adminEmail}`);
        } else {
            console.log('👑 Super Admin já existe');
        }

        console.log('\n🎉 Banco de dados PostgreSQL configurado com sucesso!');
        process.exit(0);

    } catch (err) {
        console.error('\n❌ ERRO FATAL NO SETUP DO BANCO:', err);
        process.exit(1); 
    } finally {
        await pool.end();
    }
}

setup();