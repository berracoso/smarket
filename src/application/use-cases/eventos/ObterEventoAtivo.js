/**
 * Use Case: Obter Evento Ativo
 * 
 * Busca o evento ativo no momento e retorna com informações agregadas.
 */

class ObterEventoAtivo {
    constructor(eventoRepository, apostaRepository) {
        this.eventoRepository = eventoRepository;
        this.apostaRepository = apostaRepository;
    }

    /**
     * Executa o caso de uso
     * @returns {Promise<Object>} { sucesso: true, evento: {...} }
     */
    async executar() {
        // Buscar evento ativo
        const evento = await this.eventoRepository.buscarEventoAtivo();
        
        if (!evento) {
            return {
                sucesso: true,
                evento: null,
                mensagem: 'Nenhum evento ativo no momento'
            };
        }

        // Buscar apostas do evento
        const apostas = await this.apostaRepository.listarPorEvento(evento.id);

        // Calcular totais por time
        const totalPorTime = {};
        evento.times.forEach(time => {
            totalPorTime[time] = 0;
        });

        apostas.forEach(aposta => {
            totalPorTime[aposta.time] += aposta.getValorNumerico();
        });

        // Calcular total arrecadado
        const totalArrecadado = apostas.reduce((sum, aposta) => {
            return sum + aposta.getValorNumerico();
        }, 0);

        return {
            sucesso: true,
            evento: {
                id: evento.id,
                codigo: evento.codigo,
                nome: evento.nome,
                times: evento.times,
                apostasAbertas: evento.aberto,
                status: evento.status,
                vencedor: evento.vencedor,
                criadoEm: evento.criadoEm
            },
            estatisticas: {
                totalApostas: apostas.length,
                totalArrecadado,
                totalArrecadadoFormatado: `R$ ${totalArrecadado.toFixed(2)}`,
                totalPorTime
            }
        };
    }
}

module.exports = ObterEventoAtivo;
