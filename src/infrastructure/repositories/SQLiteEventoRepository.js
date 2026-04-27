const Evento = require('../../domain/entities/Evento');

class SQLiteEventoRepository {
    constructor(dbPromise) {
        this.dbPromise = dbPromise;
    }

    async salvar(evento) {
        const db = await this.dbPromise();
        const timesJson = JSON.stringify(evento.times);
        
        await db.run(
            `INSERT INTO eventos (id, codigo, nome, times, aberto, vencedor, status, criadoEm, finalizadoEm) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET 
             aberto = excluded.aberto, vencedor = excluded.vencedor, status = excluded.status, finalizadoEm = excluded.finalizadoEm`,
            [
                evento.id, evento.codigo, evento.nome, timesJson, 
                evento.aberto ? 1 : 0, evento.vencedor, evento.status, evento.criadoEm, evento.finalizadoEm
            ]
        );
    }

    async atualizar(evento) {
        return await this.salvar(evento);
    }

    async criar(evento) {
        await this.salvar(evento);
        return evento.id;
    }

    async finalizar(id) {
        const db = await this.dbPromise();
        await db.run(
            `UPDATE eventos SET status = 'finalizado', aberto = 0, finalizadoEm = ? WHERE id = ?`,
            [new Date().toISOString(), id]
        );
    }

    async salvarHistorico(evento, totalArrecadado, totalPremios) {
        const db = await this.dbPromise();
        try {
            await db.run(
                `INSERT INTO historico_eventos (evento_id, nome, vencedor, total_arrecadado, total_premios, finalizado_em) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [evento.id, evento.nome, evento.vencedor, totalArrecadado, totalPremios, new Date().toISOString()]
            );
        } catch (error) {
            console.warn('Tabela de histórico ausente, pulando gravação do log.');
        }
    }

    // ==========================================
    // 🛡️ CORREÇÃO DE CONTRATO (ALIAS)
    // ==========================================
    // Atende aos Use Cases de Leitura
    async obterEventoAtivo() {
        const db = await this.dbPromise();
        const row = await db.get("SELECT * FROM eventos WHERE status = 'ativo' LIMIT 1");
        if (!row) return null;
        return this._mapToEntity(row);
    }

    // Atende aos Use Cases de Mutação (Apostas, Vencedor, Reset)
    async buscarEventoAtivo() {
        return await this.obterEventoAtivo();
    }
    // ==========================================

    async buscarPorId(id) {
        const db = await this.dbPromise();
        const row = await db.get('SELECT * FROM eventos WHERE id = ?', [id]);
        if (!row) return null;
        return this._mapToEntity(row);
    }

    _mapToEntity(row) {
        let timesArray = [];
        
        try {
            timesArray = row.times ? JSON.parse(row.times) : [];
        } catch (error) {
            console.error(`Erro ao fazer parse dos times do evento ${row.id}:`, error);
            timesArray = []; 
        }

        return new Evento({
            id: row.id,
            codigo: row.codigo,
            nome: row.nome,
            times: timesArray,
            aberto: Boolean(row.aberto),
            vencedor: row.vencedor,
            status: row.status,
            criadoEm: row.criadoEm,
            finalizadoEm: row.finalizadoEm
        });
    }
}

module.exports = SQLiteEventoRepository;