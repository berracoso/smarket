/**
 * Use Case: Criar Novo Evento
 * 
 * Orquestra a criação de um novo evento:
 * 1. Valida permissões (apenas Admin e Super Admin)
 * 2. Valida dados de entrada
 * 3. Cria entidade Evento
 * 4. Persiste (automaticamente arquiva eventos anteriores)
 * 5. Retorna DTO do evento criado
 */

const Evento = require('../../../domain/entities/Evento');
const ValidadorPermissoes = require('../../../domain/services/ValidadorPermissoes');

class CriarNovoEvento {
    constructor(eventoRepository, usuarioRepository) {
        this.eventoRepository = eventoRepository;
        this.usuarioRepository = usuarioRepository;
        this.validadorPermissoes = new ValidadorPermissoes();
    }

    /**
     * Executa o caso de uso
     * @param {Object} dados - { userId, nome?, times }
     * @returns {Promise<Object>} { sucesso: true, evento: {...} }
     */
    async executar({ userId, nome = null, times }) {
        // 1. Buscar usuário
        const usuario = await this.usuarioRepository.buscarPorId(userId);
        if (!usuario) {
            throw new Error('Usuário não encontrado');
        }

        // 2. Verificar permissão
        if (!this.validadorPermissoes.podeGerenciarEventos(usuario)) {
            throw new Error('Apenas Admin e Super Admin podem criar eventos');
        }

        // 3. Validar times
        if (!times || !Array.isArray(times) || times.length < 2) {
            throw new Error('É necessário informar pelo menos 2 times');
        }

        if (times.length > 10) {
            throw new Error('Máximo de 10 times por evento');
        }

        // 4. Criar entidade Evento
        const evento = new Evento({
            nome,
            times
        });

        // 5. Persistir (arquiva eventos anteriores automaticamente)
        const eventoId = await this.eventoRepository.criar(evento);

        // 6. Retornar DTO
        return {
            sucesso: true,
            evento: {
                id: eventoId,
                codigo: evento.codigo,
                nome: evento.nome,
                times: evento.times,
                apostasAbertas: evento.aberto,
                status: evento.status,
                criadoEm: evento.criadoEm
            }
        };
    }
}

module.exports = CriarNovoEvento;
