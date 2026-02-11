/**
 * Use Case: Definir Vencedor
 * 
 * Define o time vencedor de um evento e calcula a distribuição de prêmios.
 * Salva o evento no histórico.
 */

const ValidadorPermissoes = require('../../../domain/services/ValidadorPermissoes');
const CalculadoraPremios = require('../../../domain/services/CalculadoraPremios');
const TaxaPlataforma = require('../../../domain/value-objects/TaxaPlataforma');

class DefinirVencedor {
    constructor(eventoRepository, apostaRepository, usuarioRepository) {
        this.eventoRepository = eventoRepository;
        this.apostaRepository = apostaRepository;
        this.usuarioRepository = usuarioRepository;
        this.validadorPermissoes = new ValidadorPermissoes();
        this.calculadora = new CalculadoraPremios(new TaxaPlataforma());
    }

    /**
     * Executa o caso de uso
     * @param {Object} dados - { userId, timeVencedor }
     * @returns {Promise<Object>} { sucesso: true, resultado: {...} }
     */
    async executar({ userId, timeVencedor }) {
        // 1. Buscar usuário
        const usuario = await this.usuarioRepository.buscarPorId(userId);
        if (!usuario) {
            throw new Error('Usuário não encontrado');
        }

        // 2. Verificar permissão
        if (!this.validadorPermissoes.podeGerenciarEventos(usuario)) {
            throw new Error('Apenas Admin e Super Admin podem definir vencedor');
        }

        // 3. Buscar evento ativo
        const evento = await this.eventoRepository.buscarEventoAtivo();
        if (!evento) {
            throw new Error('Nenhum evento ativo no momento');
        }

        // 4. Validar ação
        this.validadorPermissoes.validarAcaoEvento(usuario, 'definir_vencedor');

        // 5. Definir vencedor (valida se apostas estão fechadas e se time existe)
        evento.definirVencedor(timeVencedor);

        // 6. Buscar todas as apostas do evento
        const apostas = await this.apostaRepository.listarPorEvento(evento.id);

        // 7. Calcular total arrecadado
        const totalArrecadado = apostas.reduce((sum, a) => sum + a.getValorNumerico(), 0);
        const taxaPlataforma = totalArrecadado * 0.05;
        const totalPremios = totalArrecadado - taxaPlataforma;

        // 8. Calcular distribuição de prêmios para vencedores
        const vencedores = this.calculadora.calcularDistribuicao(apostas, timeVencedor);

        // 9. Atualizar evento no banco
        await this.eventoRepository.atualizar(evento);

        // 10. Finalizar evento (mudar status para 'finalizado')
        await this.eventoRepository.finalizar(evento.id);

        // 11. Salvar no histórico
        await this.eventoRepository.salvarHistorico(
            evento,
            totalArrecadado,
            totalPremios
        );

        return {
            sucesso: true,
            resultado: {
                eventoId: evento.id,
                eventoNome: evento.nome,
                timeVencedor,
                totalArrecadado,
                totalPremios,
                taxaPlataforma,
                vencedores,
                quantidadeVencedores: vencedores.length
            },
            mensagem: 'Vencedor definido com sucesso!'
        };
    }
}

module.exports = DefinirVencedor;
