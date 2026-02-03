/**
 * Use Case: Novo evento
 * 
 * Arquiva o evento atual e cria um novo evento automaticamente.
 * Usado para iniciar um novo ciclo de apostas.
 */

const Evento = require('../../../domain/entities/Evento');
const ValidadorPermissoes = require('../../../domain/services/ValidadorPermissoes');

class ResetarEvento {
    constructor(eventoRepository, usuarioRepository) {
        this.eventoRepository = eventoRepository;
        this.usuarioRepository = usuarioRepository;
        this.validadorPermissoes = new ValidadorPermissoes();
    }

    /**
     * Executa o caso de uso
     * @param {Object} dados - { userId, nome?, times }
     * @returns {Promise<Object>} { sucesso: true, novoEvento: {...} }
     */
    async executar({ userId, nome = null, times }) {
        // 1. Buscar usuário
        const usuario = await this.usuarioRepository.buscarPorId(userId);
        if (!usuario) {
            throw new Error('Usuário não encontrado');
        }

        // 2. Verificar permissão
        if (!this.validadorPermissoes.podeGerenciarEventos(usuario)) {
            throw new Error('Apenas Admin e Super Admin podem Novo eventos');
        }

        // 3. Buscar evento ativo (se existir)
        const eventoAtual = await this.eventoRepository.buscarEventoAtivo();

        let eventoAntigoId = null;
        if (eventoAtual) {
            eventoAntigoId = eventoAtual.id;
            // Arquivar evento atual
            eventoAtual.arquivar();
            await this.eventoRepository.atualizar(eventoAtual);
        }

        // 4. Validar times do novo evento
        if (!times || !Array.isArray(times) || times.length < 2) {
            throw new Error('É necessário informar pelo menos 2 times');
        }

        if (times.length > 10) {
            throw new Error('Máximo de 10 times por evento');
        }

        // 5. Criar novo evento
        const novoEvento = new Evento({
            nome,
            times
        });

        const novoEventoId = await this.eventoRepository.criar(novoEvento);

        return {
            sucesso: true,
            eventoAntigoId,
            novoEvento: {
                id: novoEventoId,
                codigo: novoEvento.codigo,
                nome: novoEvento.nome,
                times: novoEvento.times,
                apostasAbertas: novoEvento.aberto,
                status: novoEvento.status,
                criadoEm: novoEvento.criadoEm
            },
            mensagem: eventoAntigoId
                ? 'Evento resetado com sucesso!'
                : 'Novo evento criado com sucesso!'
        };
    }
}

module.exports = ResetarEvento;
