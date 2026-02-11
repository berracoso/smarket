/**
 * Use Case: Listar Minhas Apostas
 * 
 * Lista todas as apostas do usuário no evento ativo.
 */

class ListarMinhasApostas {
    constructor(apostaRepository, eventoRepository) {
        this.apostaRepository = apostaRepository;
        this.eventoRepository = eventoRepository;
    }

    /**
     * Executa o caso de uso
     * @param {number} userId 
     * @returns {Promise<Object>} { sucesso: true, apostas: [...], totalApostado }
     */
    async executar(userId) {
        if (!userId) {
            throw new Error('Usuário não autenticado');
        }

        // Buscar evento ativo
        const evento = await this.eventoRepository.buscarEventoAtivo();
        if (!evento) {
            return {
                sucesso: true,
                apostas: [],
                totalApostado: 0,
                mensagem: 'Nenhum evento ativo'
            };
        }

        // Buscar apostas do usuário neste evento
        const apostas = await this.apostaRepository.listarPorUsuarioEEvento(userId, evento.id);

        // Calcular total apostado
        const totalApostado = apostas.reduce((total, aposta) => {
            return total + aposta.getValorNumerico();
        }, 0);

        return {
            sucesso: true,
            evento: {
                id: evento.id,
                nome: evento.nome,
                apostasAbertas: evento.aberto
            },
            apostas: apostas.map(aposta => ({
                id: aposta.id,
                time: aposta.time,
                valor: aposta.getValorNumerico(),
                valorFormatado: aposta.valor.formatarBRL(),
                criadoEm: aposta.timestamp
            })),
            totalApostado,
            totalApostadoFormatado: `R$ ${totalApostado.toFixed(2)}`
        };
    }
}

module.exports = ListarMinhasApostas;
