// Script utilitário para gerar hash de senha bcrypt
// Uso: node gerar-senha.js

const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🔐 Gerador de Hash Bcrypt para Bolão Privado\n');

rl.question('Digite a senha para gerar o hash: ', (senha) => {
    if (!senha) {
        console.log('❌ Senha não pode ser vazia');
        rl.close();
        return;
    }

    const hash = bcrypt.hashSync(senha, 10);

    console.log('\n✅ Hash gerado com sucesso!');
    console.log('\nSenha:', senha);
    console.log('Hash:', hash);
    console.log('\n📝 Para usar no banco de dados:');
    console.log(`UPDATE usuarios SET senha = '${hash}' WHERE email = 'seu-email@exemplo.com';`);
    console.log('\n');

    rl.close();
});
