const database = require('../src/infrastructure/database/postgres');

async function setup() {
  console.log('🔄 Iniciando Setup do Banco de Dados (Modo Seguro)...');

  try {
    // 1. Tabela de Usuários
    await database.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        isAdmin BOOLEAN DEFAULT FALSE,
        isSuperAdmin BOOLEAN DEFAULT FALSE,
        tipo VARCHAR(50) DEFAULT 'comum',
        criadoEm TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela "usuarios" verificada.');

    // 2. Tabela de Eventos
    await database.query(`
      CREATE TABLE IF NOT EXISTS eventos (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255),
        nome VARCHAR(255),
        descricao TEXT,
        status VARCHAR(50) DEFAULT 'aberto',
        times JSONB, 
        encerrado BOOLEAN DEFAULT FALSE,
        vencedor VARCHAR(255),
        dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        dataEncerramento TIMESTAMP,
        atualizadoEm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        criadoEm TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela "eventos" verificada.');

    // 3. Tabela de Apostas
    await database.query(`
      CREATE TABLE IF NOT EXISTS apostas (
        id SERIAL PRIMARY KEY,
        usuarioId INTEGER REFERENCES usuarios(id),
        eventoId INTEGER REFERENCES eventos(id),
        time VARCHAR(255),
        valor DECIMAL(10, 2) NOT NULL,
        oddNoMomento DECIMAL(5, 2),
        previsao VARCHAR(255),
        possivelRetorno DECIMAL(10, 2),
        status VARCHAR(50) DEFAULT 'pendente',
        dataAposta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        criadoEm TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela "apostas" verificada.');
    
    // 4. Criação do Admin Inicial (Só cria se não existir ninguém)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@admin.com';
    const adminPass = process.env.ADMIN_PASSWORD || '$2a$10$X.abcdefg...'; // Hash de exemplo ou use um gerador
    
    // Verifica se já existe algum usuário
    const res = await database.query('SELECT count(*) FROM usuarios');
    if (res.rows[0].count === '0') {
       console.log('👤 Nenhum usuário encontrado. Criando Super Admin...');
       // Insira aqui um admin padrão se quiser, ou deixe para criar via tela de cadastro
       // Exemplo simplificado:
       /*
       await database.query(`
         INSERT INTO usuarios (nome, email, senha, isAdmin, isSuperAdmin)
         VALUES ($1, $2, $3, $4, $5)
       `, ['Super Admin', adminEmail, adminPass, true, true]);
       */
    }

    console.log('🏁 Setup concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro no Setup:', error);
  } finally {
    // Não fecha a conexão aqui se for usar no start, mas como é script avulso, pode fechar.
    // Mas se rodar antes do server, o server vai abrir sua própria pool.
    await database.close();
  }
}

setup();