const express = require('express');
const crypto = require('crypto');
const getDbConnection = require('../../../infrastructure/database/sqlite');

module.exports = (apostasController, eventosController, authMiddleware) => {
    const router = express.Router();

    // Middleware de proteção
    const protegerRota = (req, res, next) => {
        if (authMiddleware && typeof authMiddleware.requireAuth === 'function') {
            return authMiddleware.requireAuth.bind(authMiddleware)(req, res, next);
        }
        return next();
    };

    // 1. CARREGAR DADOS GERAIS (Painel Admin - Compatibilidade)
    router.get('/dados', protegerRota, async (req, res, next) => {
        try {
            const db = await getDbConnection();
            const evento = await db.get("SELECT * FROM eventos WHERE status = 'ativo' LIMIT 1");
            
            if (!evento) {
                return res.json({ evento: null, apostas: [] });
            }

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
                    vencedor: evento.vencedor,
                    percentualTaxa: 5,
                    totalGeral: totalGeral,
                    taxaPlataforma: totalGeral * 0.05,
                    totalPremio: totalGeral * 0.95
                },
                apostas: apostas
            });
        } catch (erro) {
            console.error('Erro em /dados:', erro);
            res.status(500).json({ erro: 'Erro ao buscar dados' });
        }
    });

    // 2. ROTA RESUMO (Pública - Compatibilidade com Frontend Antigo)
    router.get('/resumo', async (req, res, next) => {
        try {
            const db = await getDbConnection();
            const evento = await db.get("SELECT * FROM eventos WHERE status = 'ativo' LIMIT 1");
            
            if (!evento) {
                return res.json(null);
            }

            let timesRaw = [];
            try { timesRaw = JSON.parse(evento.times); } catch(e){}

            const apostas = await db.all("SELECT * FROM apostas WHERE eventoId = ?", [evento.id]);
            
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
                id: evento.id,
                nome: evento.nome,
                times: timesFormatados,
                aberto: Boolean(evento.aberto),
                vencedor: evento.vencedor,
                totalGeral: totalGeral
            });
        } catch (erro) {
            console.error('Erro em /resumo:', erro);
            res.status(500).json({ erro: 'Erro ao buscar resumo' });
        }
    });

    // 3. CARREGAR USUÁRIOS
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
            res.status(500).json({ erro: 'Erro ao buscar usuários' });
        }
    });

    // 4. ABRIR E FECHAR APOSTAS
    router.post('/evento/abrir-fechar', protegerRota, async (req, res, next) => {
        try {
            const db = await getDbConnection();
            const evento = await db.get("SELECT id, aberto FROM eventos WHERE status = 'ativo' LIMIT 1");
            if (!evento) return res.status(400).json({ erro: 'Nenhum evento ativo' });

            const novoStatus = evento.aberto ? 0 : 1; 
            await db.run("UPDATE eventos SET aberto = ? WHERE id = ?", [novoStatus, evento.id]);
            res.json({ aberto: Boolean(novoStatus), sucesso: true });
        } catch (erro) {
            res.status(500).json({ erro: 'Erro ao alterar status' });
        }
    });

    // 5. DEFINIR VENCEDOR
    router.post('/vencedor', protegerRota, async (req, res, next) => {
        try {
            const db = await getDbConnection();
            const timeVencedor = req.body.time;
            
            const evento = await db.get("SELECT id, aberto FROM eventos WHERE status = 'ativo' LIMIT 1");
            if (!evento) return res.status(400).json({ erro: 'Nenhum evento ativo' });
            if (evento.aberto) return res.status(400).json({ erro: 'Feche as apostas antes de definir vencedor' });

            await db.run("UPDATE eventos SET vencedor = ?, status = 'finalizado', finalizadoEm = ? WHERE id = ?", 
                [timeVencedor, new Date().toISOString(), evento.id]);

            res.json({ sucesso: true, vencedor: timeVencedor });
        } catch (erro) {
            res.status(500).json({ erro: 'Erro ao definir vencedor' });
        }
    });

    // 6. RESETAR EVENTO
    router.post('/reset', protegerRota, async (req, res, next) => {
        try {
            const db = await getDbConnection();
            await db.run("UPDATE eventos SET status = 'arquivado' WHERE status = 'ativo'");

            const id = crypto.randomUUID();
            const times = JSON.stringify(['Time A', 'Time B', 'Time C', 'Time D']); 
            
            await db.run(
                `INSERT INTO eventos (id, codigo, nome, times, aberto, status, criadoEm) 
                 VALUES (?, ?, ?, ?, 1, 'ativo', ?)`,
                [id, `evento-${Date.now()}`, 'Novo Evento', times, new Date().toISOString()]
            );

            res.json({ sucesso: true, mensagem: 'Evento resetado e limpo!' });
        } catch (erro) {
            res.status(500).json({ erro: 'Erro ao resetar o evento' });
        }
    });

    // PROMOVER E REBAIXAR USUARIOS
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

    return router;
};