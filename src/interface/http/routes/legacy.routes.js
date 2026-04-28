const express = require('express');
const router = express.Router();
// Injeção direta da conexão do container para acessar o banco de dados
const container = require('../../../infrastructure/config/container');
const getDbConnection = container.getDbConnection;

// 1. Alimenta as "Apostas Registradas" e "Nº de Apostas" no Admin
router.get('/dados', async (req, res) => {
    try {
        const db = await getDbConnection();
        
        // Busca as apostas no banco e cruza com a tabela de usuários para exibir o nome correto
        const apostas = await db.all(`
            SELECT a.id, a.time_escolhido, a.valor, a.criado_em, u.nome 
            FROM apostas a 
            LEFT JOIN usuarios u ON a.usuario_id = u.id
            ORDER BY a.criado_em DESC
        `);
        
        const apostasFormatadas = apostas.map(a => ({
            id: a.id,
            time: a.time_escolhido,
            valor: a.valor,
            nome: a.nome || 'Usuário Desconhecido',
            timestamp: a.criado_em || new Date().toISOString()
        }));

        res.json({ apostas: apostasFormatadas });
    } catch (error) {
        console.error('Erro ao buscar dados na rota legada:', error);
        res.status(500).json({ error: true, mensagem: 'Erro interno ao buscar apostas' });
    }
});

// 2. Alimenta a "Gestão de Usuários" no Admin
router.get('/usuarios', async (req, res) => {
    try {
        const db = await getDbConnection();
        // Busca a lista real de usuários no banco de dados
        const usuarios = await db.all(`SELECT id, nome, email, is_admin, is_super_admin FROM usuarios`);
        
        const usuariosFormatados = usuarios.map(u => ({
            id: u.id,
            nome: u.nome,
            email: u.email,
            isAdmin: Boolean(u.is_admin),
            isSuperAdmin: Boolean(u.is_super_admin)
        }));

        res.json({ usuarios: usuariosFormatados });
    } catch (error) {
        console.error('Erro ao buscar usuários na rota legada:', error);
        res.status(500).json({ error: true, mensagem: 'Erro interno ao buscar usuários' });
    }
});

module.exports = router;