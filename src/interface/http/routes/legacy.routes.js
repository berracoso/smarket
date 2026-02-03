/**
 * Rotas de Compatibilidade (Legacy)
 * 
 * Mantém compatibilidade com o frontend antigo
 * redirecionando para as novas rotas da Clean Architecture
 */

const express = require('express');

module.exports = (apostasController, eventosController, authMiddleware) => {
    const router = express.Router();

    /**
     * GET /resumo
     * Retorna resumo do evento ativo (compatibilidade)
     * Mapeia para: GET /eventos/ativo
     */
    router.get('/resumo', async (req, res, next) => {
        try {
            // Buscar evento ativo usando o controller
            const container = require('../../../infrastructure/config/container');
            const obterEventoAtivo = container.get('obterEventoAtivo');
            
            const resultado = await obterEventoAtivo.executar();
            
            if (!resultado.sucesso || !resultado.evento) {
                return res.json({
                    aberto: false,
                    times: {},
                    totalGeral: 0,
                    totalPremio: 0,
                    taxaPlataforma: 0,
                    percentualTaxa: 5,
                    vencedor: null
                });
            }
            
            const { evento, estatisticas } = resultado;
            
            // Calcular dados por time
            const times = {};
            const totalGeral = estatisticas.totalArrecadado;
            const taxaPlataforma = totalGeral * 0.05;
            const totalPremio = totalGeral - taxaPlataforma;
            
            evento.times.forEach(time => {
                const totalTime = estatisticas.totalPorTime[time] || 0;
                const percentual = totalGeral > 0 
                    ? ((totalTime / totalGeral) * 100).toFixed(1)
                    : '0.0';
                
                times[time] = {
                    total: totalTime,
                    percentual: parseFloat(percentual)
                };
            });
            
            // Retornar no formato esperado pelo frontend antigo
            res.json({
                aberto: evento.apostasAbertas,
                times,
                totalGeral,
                totalPremio,
                taxaPlataforma,
                percentualTaxa: 5,
                vencedor: evento.vencedor
            });
        } catch (erro) {
            next(erro);
        }
    });

    /**
     * GET /minhas-apostas
     * Lista apostas do usuário no evento ativo (compatibilidade)
     * Formato esperado pelo frontend:
     * { apostas: [{ time, valor, timestamp, retornoEstimado, lucroEstimado }], valorTotal, total }
     */
    router.get('/minhas-apostas', authMiddleware.requireAuth(), async (req, res, next) => {
        try {
            const container = require('../../../infrastructure/config/container');
            const listarMinhasApostas = container.get('listarMinhasApostas');
            const obterEventoAtivo = container.get('obterEventoAtivo');
            const apostaRepository = container.get('apostaRepository');
            
            const resultado = await listarMinhasApostas.executar(req.userId);
            
            if (!resultado.sucesso || resultado.apostas.length === 0) {
                return res.json({
                    apostas: [],
                    valorTotal: 0,
                    total: 0
                });
            }

            // Buscar dados do evento para calcular retorno estimado
            const eventoRes = await obterEventoAtivo.executar();
            const totalGeral = eventoRes.estatisticas?.totalArrecadado || 0;
            const totalPremio = totalGeral * 0.95; // Desconta 5%

            // Calcular total por time
            const apostasEvento = await apostaRepository.listarPorEvento(resultado.evento.id);
            const totalPorTime = {};
            eventoRes.evento?.times?.forEach(t => { totalPorTime[t] = 0; });
            apostasEvento.forEach(a => {
                totalPorTime[a.time] = (totalPorTime[a.time] || 0) + a.getValorNumerico();
            });

            // Formatar apostas com campos esperados pelo frontend
            const apostasFormatadas = resultado.apostas.map(aposta => {
                const totalTime = totalPorTime[aposta.time] || aposta.valor;
                const retornoEstimado = totalPremio > 0 && totalTime > 0
                    ? ((aposta.valor / totalTime) * totalPremio).toFixed(2)
                    : aposta.valor.toFixed(2);
                const lucroEstimado = (parseFloat(retornoEstimado) - aposta.valor).toFixed(2);

                return {
                    time: aposta.time,
                    valor: aposta.valor,
                    timestamp: aposta.criadoEm,
                    retornoEstimado,
                    lucroEstimado
                };
            });

            res.json({
                apostas: apostasFormatadas,
                valorTotal: resultado.totalApostado,
                total: resultado.apostas.length
            });
        } catch (erro) {
            next(erro);
        }
    });

    /**
     * GET /eventos
     * Lista eventos (compatibilidade)
     * Mapeia para: GET /eventos/ativo
     */
    router.get('/eventos', (req, res, next) => {
        // Retornar array com evento ativo para compatibilidade
        eventosController.ativo(req, res, (erro) => {
            if (erro) return next(erro);
            
            // Wrapper para manter compatibilidade
            const originalJson = res.json.bind(res);
            res.json = (data) => {
                if (data.evento) {
                    originalJson({ eventos: [data.evento] });
                } else {
                    originalJson({ eventos: [] });
                }
            };
            
            next();
        });
    });

    /**
     * GET /historico-apostas
     * Histórico de apostas com paginação (compatibilidade)
     * Mapeia para: GET /apostas/historico
     */
    router.get('/historico-apostas', authMiddleware.requireAuth(), (req, res, next) => {
        apostasController.historico(req, res, next);
    });

    /**
     * GET /minhas-estatisticas
     * Estatísticas do usuário (compatibilidade)
     * Calcula a partir das apostas do histórico
     */
    router.get('/minhas-estatisticas', authMiddleware.requireAuth(), async (req, res, next) => {
        try {
            const container = require('../../../infrastructure/config/container');
            
            const obterHistorico = container.get('obterHistoricoApostas');
            const resultado = await obterHistorico.executar({
                userId: req.userId,
                limite: 1000,
                pagina: 1
            });
            
            // Calcular estatísticas
            const apostas = resultado.apostas;
            const totalApostado = apostas.reduce((sum, a) => sum + a.valor, 0);
            const totalApostas = apostas.length;
            const apostasGanhas = apostas.filter(a => a.ganhou).length;
            const taxaAcerto = totalApostas > 0 ? ((apostasGanhas / totalApostas) * 100).toFixed(1) : '0.0';
            const eventosParticipados = new Set(apostas.map(a => a.eventoId)).size;
            
            res.json({
                totalApostado: totalApostado.toFixed(2),
                totalApostas,
                apostasGanhas,
                taxaAcerto: parseFloat(taxaAcerto),
                eventosParticipados
            });
        } catch (erro) {
            next(erro);
        }
    });

    /**
     * GET /dados
     * Retorna dados completos para admin (compatibilidade)
     */
    router.get('/dados', authMiddleware.requireAuth(), async (req, res, next) => {
        try {
            const container = require('../../../infrastructure/config/container');
            const obterEventoAtivo = container.get('obterEventoAtivo');
            const apostaRepository = container.get('apostaRepository');
            
            const resultado = await obterEventoAtivo.executar();
            
            if (!resultado.sucesso || !resultado.evento) {
                return res.json({
                    evento: null,
                    apostas: []
                });
            }
            
            // Buscar todas as apostas do evento
            const apostas = await apostaRepository.listarPorEvento(resultado.evento.id);
            
            res.json({
                evento: {
                    id: resultado.evento.id,
                    codigo: resultado.evento.codigo,
                    nome: resultado.evento.nome,
                    times: resultado.evento.times,
                    aberto: resultado.evento.apostasAbertas,
                    vencedor: resultado.evento.vencedor
                },
                apostas: apostas.map(a => ({
                    id: a.id,
                    userId: a.userId,
                    nome: a.nome,
                    time: a.time,
                    valor: a.getValorNumerico(),
                    timestamp: a.timestamp
                }))
            });
        } catch (erro) {
            next(erro);
        }
    });

    /**
     * GET /usuarios
     * Lista todos os usuários (compatibilidade - Admin)
     */
    router.get('/usuarios', authMiddleware.requireAuth(), async (req, res, next) => {
        try {
            const container = require('../../../infrastructure/config/container');
            const usuarioRepository = container.get('usuarioRepository');
            
            // Buscar todos os usuários
            const usuarios = await usuarioRepository.listarTodos();
            
            res.json({
                usuarios: usuarios.map(u => ({
                    id: u.id,
                    nome: u.nome,
                    email: u.email.valor,
                    papel: u.tipo,  // 'usuario', 'admin', ou 'superadmin'
                    isAdmin: u.isAdmin,
                    isSuperAdmin: u.isSuperAdmin
                }))
            });
        } catch (erro) {
            next(erro);
        }
    });

    /**
     * POST /usuarios/:id/promover
     * Promove usuário para admin (compatibilidade)
     */
    router.post('/usuarios/:id/promover', authMiddleware.requireAuth(), async (req, res, next) => {
        try {
            const container = require('../../../infrastructure/config/container');
            const usuarioRepository = container.get('usuarioRepository');
            
            const userId = parseInt(req.params.id);
            const usuario = await usuarioRepository.buscarPorId(userId);
            
            if (!usuario) {
                return res.status(404).json({ erro: 'Usuário não encontrado' });
            }
            
            // Promover para admin
            usuario.papel = 'admin';
            await usuarioRepository.atualizar(usuario);
            
            res.json({ 
                sucesso: true, 
                mensagem: `${usuario.nome} promovido para Admin` 
            });
        } catch (erro) {
            next(erro);
        }
    });

    /**
     * POST /usuarios/:id/rebaixar
     * Rebaixa usuário para user (compatibilidade)
     */
    router.post('/usuarios/:id/rebaixar', authMiddleware.requireAuth(), async (req, res, next) => {
        try {
            const container = require('../../../infrastructure/config/container');
            const usuarioRepository = container.get('usuarioRepository');
            
            const userId = parseInt(req.params.id);
            const usuario = await usuarioRepository.buscarPorId(userId);
            
            if (!usuario) {
                return res.status(404).json({ erro: 'Usuário não encontrado' });
            }
            
            // Rebaixar para user
            usuario.papel = 'user';
            await usuarioRepository.atualizar(usuario);
            
            res.json({ 
                sucesso: true, 
                mensagem: `${usuario.nome} rebaixado para Usuário` 
            });
        } catch (erro) {
            next(erro);
        }
    });

    /**
     * POST /evento/abrir-fechar
     * Toggle de apostas (compatibilidade)
     * O frontend chama sem body, espera toggle automático
     * Retorna: { aberto: boolean }
     */
    router.post('/evento/abrir-fechar', authMiddleware.requireAuth(), async (req, res, next) => {
        try {
            const container = require('../../../infrastructure/config/container');
            const eventoRepository = container.get('eventoRepository');
            const abrirFecharApostas = container.get('abrirFecharApostas');
            
            // Buscar estado atual para fazer toggle
            const evento = await eventoRepository.buscarEventoAtivo();
            if (!evento) {
                return res.status(400).json({ erro: 'Nenhum evento ativo' });
            }

            // Toggle: se está aberto, fecha; se está fechado, abre
            const novoEstado = !evento.aberto;
            
            const resultado = await abrirFecharApostas.executar({
                userId: req.userId,
                abrir: novoEstado
            });
            
            // Retornar no formato esperado pelo frontend
            res.json({
                aberto: resultado.apostasAbertas,
                sucesso: resultado.sucesso,
                mensagem: resultado.mensagem
            });
        } catch (erro) {
            next(erro);
        }
    });

    /**
     * POST /vencedor
     * Define vencedor do evento (compatibilidade)
     * Formato esperado pelo admin.html:
     * { vencedor, totalGeral, taxaPlataforma, totalPremio, vencedores: [{nome, apostado, ganho, lucro}] }
     */
    router.post('/vencedor', authMiddleware.requireAuth(), async (req, res, next) => {
        try {
            const container = require('../../../infrastructure/config/container');
            const definirVencedor = container.get('definirVencedor');
            
            const resultado = await definirVencedor.executar({
                userId: req.userId,
                timeVencedor: req.body.time
            });
            
            if (!resultado.sucesso) {
                return res.json(resultado);
            }

            // Retornar no formato esperado pelo frontend
            // Os vencedores já vêm com nome, apostado, ganho, lucro do calcularDistribuicao
            res.json({
                vencedor: req.body.time,
                totalGeral: resultado.resultado.totalArrecadado,
                taxaPlataforma: resultado.resultado.taxaPlataforma,
                totalPremio: resultado.resultado.totalPremios,
                vencedores: resultado.resultado.vencedores,
                sucesso: true
            });
        } catch (erro) {
            next(erro);
        }
    });

    /**
     * POST /reset
     * Reseta o evento atual (compatibilidade)
     * Sempre cria com 4 times padrão se não informar times
     */
    router.post('/reset', authMiddleware.requireAuth(), async (req, res, next) => {
        try {
            const container = require('../../../infrastructure/config/container');
            const resetarEvento = container.get('resetarEvento');
            
            // Se não informou times, usar os 4 times padrão
            let times = req.body.times;
            if (!times || !Array.isArray(times) || times.length < 2) {
                times = ['Time A', 'Time B', 'Time C', 'Time D'];
            }
            
            const resultado = await resetarEvento.executar({
                userId: req.userId,
                nome: req.body.nome,
                times
            });
            
            res.json(resultado);
        } catch (erro) {
            next(erro);
        }
    });

    return router;
};
