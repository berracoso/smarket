/**
 * Use Case: Obter Histórico de Apostas
 * 
 * Lista o histórico completo de apostas do usuário em todos os eventos,
 * com suporte a filtros e paginação.
 */

class ObterHistoricoApostas {
    constructor(apostaRepository, eventoRepository) {
        this.apostaRepository = apostaRepository;
        this.eventoRepository = eventoRepository;
    }

    /**
     * Executa o caso de uso
     * @param {Object} dados - { userId, eventoId?, dataInicio?, dataFim?, limite?, pagina? }
     * @returns {Promise<Object>} { sucesso: true, apostas: [...], estatisticas }
     */
    async executar({ userId, eventoId = null, dataInicio = null, dataFim = null, limite = 5, pagina = 1 }) {
        if (!userId) {
            throw new Error('Usuário não autenticado');
        }

        // Preparar filtros
        const filtros = {};
        if (eventoId) {
            filtros.eventoId = eventoId;
        }
        if (dataInicio) {
            filtros.dataInicio = dataInicio;
        }
        if (dataFim) {
            filtros.dataFim = dataFim;
        }

        // Buscar apostas do usuário (sem limite para calcular estatísticas)
        const todasApostasUsuario = await this.apostaRepository.listarPorUsuario(userId, filtros);

        // Calcular estatísticas
        const totalApostado = todasApostasUsuario.reduce((sum, aposta) => sum + aposta.getValorNumerico(), 0);
        const totalApostas = todasApostasUsuario.length;

        // Eventos únicos participados
        const eventosIds = [...new Set(todasApostasUsuario.map(a => a.eventoId))];
        
        // Buscar detalhes dos eventos para saber vencedores
        const eventosMap = new Map();
        for (const id of eventosIds) {
            const evento = await this.eventoRepository.buscarPorId(id);
            if (evento) {
                eventosMap.set(id, evento);
            }
        }

        // Cache de apostas por evento (para cálculo de odds correto)
        const apostasEventoCache = new Map();

        // Aplicar paginação
        const offset = (pagina - 1) * limite;
        const apostasPaginadas = todasApostasUsuario.slice(offset, offset + limite);

        const totalPaginas = Math.ceil(totalApostas / limite);

        // Mapear apostas com informações do evento
        const apostasMapeadas = await Promise.all(apostasPaginadas.map(async (aposta) => {
            const evento = eventosMap.get(aposta.eventoId);
            const ganhou = evento && evento.vencedor && evento.vencedor === aposta.time;
            const eventoFinalizado = evento && evento.vencedor;
            
            // Calcular lucro se ganhou
            let lucroReal = null;
            if (ganhou && evento) {
                // Buscar TODAS as apostas deste evento (de todos os usuários) para calcular odds corretas
                if (!apostasEventoCache.has(aposta.eventoId)) {
                    const todasApostasEvento = await this.apostaRepository.listarPorEvento(aposta.eventoId);
                    apostasEventoCache.set(aposta.eventoId, todasApostasEvento);
                }
                
                const apostasDoEvento = apostasEventoCache.get(aposta.eventoId);
                const totalGeral = apostasDoEvento.reduce((sum, a) => sum + a.getValorNumerico(), 0);
                const totalTimeVencedor = apostasDoEvento
                    .filter(a => a.time === evento.vencedor)
                    .reduce((sum, a) => sum + a.getValorNumerico(), 0);
                
                if (totalTimeVencedor > 0) {
                    const taxaPlataforma = 0.05; // 5% de taxa
                    const totalPremio = totalGeral * (1 - taxaPlataforma);
                    const odds = totalPremio / totalTimeVencedor;
                    const retornoBruto = aposta.getValorNumerico() * odds;
                    lucroReal = (retornoBruto - aposta.getValorNumerico()).toFixed(2);
                }
            }
            
            return {
                id: aposta.id,
                eventoId: aposta.eventoId,
                eventoNome: evento ? evento.nome : 'Evento desconhecido',
                time: aposta.time,
                valor: aposta.getValorNumerico(),
                valorFormatado: aposta.valor.formatarBRL(),
                timestamp: aposta.timestamp || aposta.criadoEm,
                criadoEm: aposta.criadoEm,
                ganhou: ganhou,
                lucroReal: lucroReal,
                eventoStatus: eventoFinalizado ? 'finalizado' : 'em_andamento',
                status: evento ? (evento.vencedor ? (ganhou ? 'ganhou' : 'perdeu') : 'pendente') : 'desconhecido'
            };
        }));

        // Recalcular estatísticas com dados corretos de ganho
        const apostasGanhas = todasApostasUsuario.filter(aposta => {
            const evento = eventosMap.get(aposta.eventoId);
            return evento && evento.vencedor && evento.vencedor === aposta.time;
        }).length;

        return {
            sucesso: true,
            apostas: apostasMapeadas,
            paginacao: {
                paginaAtual: pagina,
                totalPaginas,
                itensPorPagina: limite,
                totalItens: totalApostas
            },
            estatisticas: {
                totalApostado,
                totalApostadoFormatado: `R$ ${totalApostado.toFixed(2)}`,
                totalApostas,
                apostasGanhas,
                eventosParticipados: eventosIds.length
            }
        };
    }
}

module.exports = ObterHistoricoApostas;
