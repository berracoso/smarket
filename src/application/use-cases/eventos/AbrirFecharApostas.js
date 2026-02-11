/**
 * Use Case: Abrir/Fechar Apostas
 * 
 * Permite Admin/Super Admin alternar o estado das apostas (aberto/fechado).
 */

const ValidadorPermissoes = require('../../../domain/services/ValidadorPermissoes');

class AbrirFecharApostas {
    constructor(eventoRepository, usuarioRepository) {
        this.eventoRepository = eventoRepository;
        this.usuarioRepository = usuarioRepository;
        this.validadorPermissoes = new ValidadorPermissoes();
    }

    /**
     * Executa o caso de uso
     * @param {Object} dados - { userId, abrir: boolean }
     * @returns {Promise<Object>} { sucesso: true, apostasAbertas }
     */
    async executar({ userId, abrir }) {
        // 1. Buscar usuário
        const usuario = await this.usuarioRepository.buscarPorId(userId);
        if (!usuario) {
            throw new Error('Usuário não encontrado');
        }

        // 2. Verificar permissão
        if (!this.validadorPermissoes.podeGerenciarEventos(usuario)) {
            throw new Error('Apenas Admin e Super Admin podem gerenciar apostas');
        }

        // 3. Buscar evento ativo
        const evento = await this.eventoRepository.buscarEventoAtivo();
        if (!evento) {
            throw new Error('Nenhum evento ativo no momento');
        }

        // 4. Validar ação
        this.validadorPermissoes.validarAcaoEvento(usuario, abrir ? 'abrir' : 'fechar');

        // 5. Alterar estado
        if (abrir) {
            evento.abrir();
        } else {
            evento.fechar();
        }

        // 6. Persistir
        await this.eventoRepository.atualizar(evento);

        return {
            sucesso: true,
            apostasAbertas: evento.aberto,
            mensagem: evento.aberto ? 'Apostas abertas' : 'Apostas fechadas'
        };
    }
}

module.exports = AbrirFecharApostas;
