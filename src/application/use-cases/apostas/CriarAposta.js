/**
 * Use Case: Criar Aposta
 * 
 * Orquestra o processo de criação de uma aposta:
 * 1. Valida dados de entrada
 * 2. Busca evento ativo
 * 3. Verifica se apostas estão abertas
 * 4. Verifica permissões do usuário (Super Admin não pode apostar)
 * 5. Valida se o time existe no evento
 * 6. Cria a entidade Aposta
 * 7. Persiste no banco
 */

const Aposta = require('../../../domain/entities/Aposta');
const ValorAposta = require('../../../domain/value-objects/ValorAposta');
const ValidadorPermissoes = require('../../../domain/services/ValidadorPermissoes');

class CriarAposta {
    constructor(apostaRepository, eventoRepository, usuarioRepository) {
        this.apostaRepository = apostaRepository;
        this.eventoRepository = eventoRepository;
        this.usuarioRepository = usuarioRepository;
        this.validadorPermissoes = new ValidadorPermissoes();
    }

    /**
     * Executa o caso de uso
     * @param {Object} dados - { userId, time, valor }
     * @returns {Promise<Object>} { sucesso: true, aposta: {...} }
     */
    async executar({ userId, time, valor }) {
        // 1. Buscar usuário
        const usuario = await this.usuarioRepository.buscarPorId(userId);
        if (!usuario) {
            throw new Error('Usuário não encontrado');
        }

        // 2. Verificar permissão para apostar
        if (!this.validadorPermissoes.podeApostar(usuario)) {
            throw new Error('Super Admin não pode apostar');
        }

        // 3. Buscar evento ativo
        const evento = await this.eventoRepository.buscarEventoAtivo();
        if (!evento) {
            throw new Error('Nenhum evento ativo no momento');
        }

        // 4. Verificar se apostas estão abertas
        if (!evento.estaAberto()) {
            throw new Error('Apostas estão fechadas para este evento');
        }

        // 5. Validar se o time existe no evento
        if (!evento.contemTime(time)) {
            throw new Error('Time não existe neste evento');
        }

        // 6. Validar valor da aposta (via Value Object)
        const valorAposta = new ValorAposta(valor);

        // 7. Criar entidade Aposta
        const aposta = new Aposta({
            userId: usuario.id,
            eventoId: evento.id,
            eventoNome: evento.nome,
            nome: usuario.nome,
            time,
            valor: valorAposta
        });

        // 8. Persistir
        const apostaId = await this.apostaRepository.criar(aposta);

        // 9. Retornar DTO
        return {
            sucesso: true,
            aposta: {
                id: apostaId,
                userId: aposta.userId,
                eventoId: aposta.eventoId,
                eventoNome: aposta.eventoNome,
                nome: aposta.nome,
                time: aposta.time,
                valor: aposta.getValorNumerico(),
                valorFormatado: aposta.valor.formatarBRL(),
                criadoEm: aposta.criadoEm
            }
        };
    }
}

module.exports = CriarAposta;
