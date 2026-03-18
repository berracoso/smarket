const getDbConnection = require('../src/infrastructure/database/sqlite');

async function promoverUsuario() {
    // Pega o e-mail que você vai digitar no terminal
    const email = process.argv[2]; 

    if (!email) {
        console.log('❌ Por favor, informe o e-mail do utilizador.');
        console.log('👉 Exemplo: node scripts/tornar-admin.js utilizador@email.com');
        process.exit(1);
    }

    try {
        const db = await getDbConnection();
        
        // Atualiza as permissões diretamente no SQLite
        const resultado = await db.run(
            'UPDATE usuarios SET isAdmin = 1, isSuperAdmin = 1 WHERE email = ?',
            [email]
        );

        if (resultado.changes > 0) {
            console.log(`✅ SUCESSO! A conta "${email}" agora é um SUPER ADMIN.`);
            console.log('👉 Faça logout e login novamente no site para atualizar a sua sessão.');
        } else {
            console.log(`⚠️ ERRO: Nenhum utilizador encontrado com o e-mail "${email}".`);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro no banco de dados:', error);
        process.exit(1);
    }
}

promoverUsuario();