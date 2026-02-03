/**
 * Entity: Evento
 * Representa um evento de apostas
 * 
 * Status Possíveis:
 * - ativo: Evento atual, pode ou não estar aberto para apostas
 * - finalizado: Evento encerrado com vencedor definido
 * - arquivado: Evento antigo, movido para histórico
 */

class Evento {
    constructor({ id, codigo, nome, times, aberto = true, vencedor = null, status = 'ativo', criadoEm = null, finalizadoEm = null }) {
        this.id = id;
        this.codigo = codigo || this._gerarCodigo();
        this.nome = nome || this._gerarNome();
        this.times = this._validarTimes(times);
        this.aberto = aberto;
        this.vencedor = vencedor;
        this.status = this._validarStatus(status);
        this.criadoEm = criadoEm || new Date().toISOString();
        this.finalizadoEm = finalizadoEm;
    }

    _gerarCodigo() {
        return `evento-${Date.now()}`;
    }

    _gerarNome() {
        const data = new Date().toLocaleDateString('pt-BR');
        return `Evento ${data}`;
    }

    _validarTimes(times) {
        if (!Array.isArray(times) || times.length < 2) {
            throw new Error('Evento deve ter no mínimo 2 times');
        }

        if (times.length > 10) {
            throw new Error('Evento pode ter no máximo 10 times');
        }

        // Verificar duplicatas
        const timesUnicos = new Set(times);
        if (timesUnicos.size !== times.length) {
            throw new Error('Times duplicados não são permitidos');
        }

        return times;
    }

    _validarStatus(status) {
        const statusValidos = ['ativo', 'finalizado', 'arquivado'];
        if (!statusValidos.includes(status)) {
            throw new Error(`Status inválido. Use: ${statusValidos.join(', ')}`);
        }
        return status;
    }

    estaAberto() {
        return this.aberto && this.status === 'ativo';
    }

    estaAtivo() {
        return this.status === 'ativo';
    }

    contemTime(nomeTime) {
        return this.times.includes(nomeTime);
    }

    fechar() {
        if (!this.estaAtivo()) {
            throw new Error('Apenas eventos ativos podem ser fechados');
        }
        this.aberto = false;
    }

    abrir() {
        if (!this.estaAtivo()) {
            throw new Error('Apenas eventos ativos podem ser abertos');
        }
        if (this.vencedor) {
            throw new Error('Evento com vencedor não pode ser reaberto');
        }
        this.aberto = true;
    }

    definirVencedor(nomeTime) {
        if (this.aberto) {
            throw new Error('Feche as apostas antes de definir o vencedor');
        }

        if (!this.contemTime(nomeTime)) {
            throw new Error('Time vencedor não está na lista de times do evento');
        }

        this.vencedor = nomeTime;
        this.status = 'finalizado';
        this.finalizadoEm = new Date().toISOString();
    }

    arquivar() {
        this.status = 'arquivado';
        if (!this.finalizadoEm) {
            this.finalizadoEm = new Date().toISOString();
        }
    }

    toJSON() {
        return {
            id: this.id,
            codigo: this.codigo,
            nome: this.nome,
            times: this.times,
            aberto: this.aberto,
            vencedor: this.vencedor,
            status: this.status,
            criadoEm: this.criadoEm,
            finalizadoEm: this.finalizadoEm
        };
    }
}

module.exports = Evento;
