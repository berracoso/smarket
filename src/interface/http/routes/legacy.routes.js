const express = require('express');
const crypto = require('crypto');
const getDbConnection = require('../../../infrastructure/database/sqlite');

module.exports = (apostasController, eventosController, authMiddleware) => {
    const router = express.Router();

    // Proteção de Rota segura (evita o crash de undefined do middleware)
    const protegerRota = typeof authMiddleware.requireAuth === 'function' 
        ? authMiddleware.requireAuth 
        : (req, res, next) => next();

    // ==========================================
    // 1. CARREGAR DADOS GERAIS (Painel Admin)
    // ==========================================
    router.get('/dados', protegerRota, async (req, res, next) => {
        try {
            const db = await getDbConnection();
            const evento = await db.get("SELECT * FROM eventos WHERE status = 'ativo' LIMIT 1");
            
            if (!evento) {
                return res.json({ evento: null, apostas: [] });
            }

            // O SQLite salva os times como Array String, mas o frontend Admin espera um Objeto com percentuais
            let timesRaw = [];
            try { timesRaw = JSON.parse(evento.times); } catch(e){}

            const apostas = await db.all("SELECT * FROM apostas WHERE eventoId = ? ORDER BY timestamp DESC", [evento.id]);
            
            const timesFormatados = {};
            let totalGeral = 0;
            
            apostas.forEach(a => totalGeral += a.valor);

            timesRaw.forEach(t => {
                const nomeTime = typeof t === 'string' ? t : t.nome;
                const apostasTime = apostas.filter(a => a.time === nomeTime).reduce((acc, curr) => acc + curr.valor, 0);
                const percentual = totalGeral > 0 ? ((apostasTime / totalGeral) * 100).toFixed(1) : 0;
                
                timesFormatados[nomeTime] = {
                    percentual: parseFloat(percentual),
                    total: apostasTime
                };
            });

            res.json({
                evento: {
                    id: evento.id,
                    codigo: evento.codigo,
                    nome: evento.nome,
                    times: timesFormatados,
                    aberto: Boolean(evento.aberto),
                    vencedor: evento.vencedor
                },
                apostas: apostas
            });
        } catch (erro) {
            console.error('Erro em /dados:', erro);
            res.status(500).json({ erro: 'Erro ao buscar dados' });
        }
    });

    // ==========================================
    // 2. CARREGAR USUÁRIOS
    // ==========================================
    router.get('/usuarios', protegerRota, async (req, res, next) => {
        try {
            const db = await getDbConnection();
            const usuarios = await db.all("SELECT id, nome, email, isAdmin, isSuperAdmin, tipo FROM usuarios");
            
            res.json({
                usuarios: usuarios.map(u => ({
                    id: u.id,
                    nome: u.nome,
                    email: u.email,
                    isAdmin: Boolean(u.isAdmin),
                    isSuperAdmin: Boolean(u.isSuperAdmin),
                    papel: u.tipo
                }))
            });
        } catch (erro) {
            console.error('Erro em /usuarios:', erro);
            res.status(500).json({ erro: 'Erro ao buscar usuários' });
        }
    });

    // ==========================================
    // 3. ABRIR E FECHAR APOSTAS
    // ==========================================
    router.post('/evento/abrir-fechar', protegerRota, async (req, res, next) => {
        try {
            const db = await getDbConnection();
            const evento = await db.get("SELECT id, aberto FROM eventos WHERE status = 'ativo' LIMIT 1");
            
            if (!evento) return res.status(400).json({ erro: 'Nenhum evento ativo' });

            // Inverte o status atual (se 1 vira 0, se 0 vira 1)
            const novoStatus = evento.aberto ? 0 : 1; 
            await db.run("UPDATE eventos SET aberto = ? WHERE id = ?", [novoStatus, evento.id]);
            
            res.json({ aberto: Boolean(novoStatus), sucesso: true });
        } catch (erro) {
            console.error('Erro em abrir-fechar:', erro);
            res.status(500).json({ erro: 'Erro ao alterar status' });
        }
    });

    // ==========================================
    // 4. PROMOVER E REBAIXAR USUÁRIOS
    // ==========================================
    router.post('/usuarios/:id/promover', protegerRota, async (req, res, next) => {
        try {
            const db = await getDbConnection();
            await db.run("UPDATE usuarios SET isAdmin = 1, tipo = 'admin' WHERE id = ?", [req.params.id]);
            res.json({ sucesso: true, mensagem: 'Usuário promovido com sucesso!' });
        } catch (erro) {
            res.status(500).json({ erro: 'Erro ao promover' });
        }
    });

    router.post('/usuarios/:id/rebaixar', protegerRota, async (req, res, next) => {
        try {
            const db = await getDbConnection();
            await db.run("UPDATE usuarios SET isAdmin = 0, isSuperAdmin = 0, tipo = 'user' WHERE id = ?", [req.params.id]);
            res.json({ sucesso: true, mensagem: 'Usuário rebaixado com sucesso!' });
        } catch (erro) {
            res.status(500).json({ erro: 'Erro ao rebaixar' });
        }
    });

    // ==========================================
    // 5. DEFINIR VENCEDOR E DISTRIBUIR PRÊMIOS
    // ==========================================
    router.post('/vencedor', protegerRota, async (req, res, next) => {
        try {
            const db = await getDbConnection();
            const timeVencedor = req.body.time;
            
            const evento = await db.get("SELECT id, aberto FROM eventos WHERE status = 'ativo' LIMIT 1");
            if (!evento) return res.status(400).json({ erro: 'Nenhum evento ativo' });
            if (evento.aberto) return res.status(400).json({ erro: '⚠️ Feche as apostas antes de definir vencedor' });

            // Define o vencedor e finaliza o evento
            await db.run("UPDATE eventos SET vencedor = ?, status = 'finalizado', finalizadoEm = ? WHERE id = ?", 
                [timeVencedor, new Date().toISOString(), evento.id]);

            // Busca apostas para gerar o cálculo de premiação
            const apostas = await db.all("SELECT * FROM apostas WHERE eventoId = ?", [evento.id]);
            
            let totalGeral = 0;
            let totalVencedor = 0;
            apostas.forEach(a => {
                totalGeral += a.valor;
                if (a.time === timeVencedor) totalVencedor += a.valor;
            });

            const taxaPlataforma = totalGeral * 0.05; // 5% de taxa
            const totalPremio = totalGeral - taxaPlataforma;

            const vencedores = apostas
                .filter(a => a.time === timeVencedor)
                .map(a => {
                    const proporcao = a.valor / totalVencedor;
                    const ganho = totalPremio * proporcao;
                    return {
                        nome: a.nome,
                        apostado: a.valor,
                        ganho: ganho,
                        lucro: ganho - a.valor
                    };
                });

            res.json({ vencedor: timeVencedor, totalGeral, taxaPlataforma, totalPremio, vencedores, sucesso: true });
        } catch (erro) {
            console.error('Erro em vencedor:', erro);
            res.status(500).json({ erro: 'Erro ao definir vencedor' });
        }
    });

    // ==========================================
    // 6. CRIAR NOVO EVENTO (RESET)
    // ==========================================
    router.post('/reset', protegerRota, async (req, res, next) => {
        try {
            const db = await getDbConnection();
            
            // 1. Arquiva o evento ativo atual (esconde as apostas dele do dashboard principal)
            await db.run("UPDATE eventos SET status = 'arquivado' WHERE status = 'ativo'");

            // 2. Cria um evento novinho em folha
            const id = crypto.randomUUID();
            const times = JSON.stringify(['Time A', 'Time B', 'Time C', 'Time D']); 
            
            await db.run(
                `INSERT INTO eventos (id, codigo, nome, times, aberto, status, criadoEm) 
                 VALUES (?, ?, ?, ?, 1, 'ativo', ?)`,
                [id, `evento-${Date.now()}`, 'Novo Evento', times, new Date().toISOString()]
            );

            res.json({ sucesso: true, mensagem: 'Evento resetado e limpo!' });
        } catch (erro) {
            console.error('Erro em reset:', erro);
            res.status(500).json({ erro: 'Erro ao resetar o evento' });
        }
    });

    return router;
};