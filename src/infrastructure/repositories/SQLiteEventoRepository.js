const Evento = require('../../domain/entities/Evento');

class SQLiteEventoRepository {
    constructor(dbPromise) {
        this.dbPromise = dbPromise;
    }

    // 1. Método estrito para INSERIR novos eventos
    async criar(evento) {
        const db = await this.dbPromise();
        const timesJson = JSON.stringify(evento.times);
        
        await db.run(
            `INSERT INTO eventos (id, codigo, nome, times, aberto, vencedor, status, criadoEm, finalizadoEm) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                evento.id, evento.codigo, evento.nome, timesJson, 
                evento.aberto ? 1 : 0, evento.vencedor, evento.status, evento.criadoEm, evento.finalizadoEm
            ]
        );
        return evento.id;
    }

    // 2. Método estrito para ATUALIZAR eventos existentes (Evita o erro de conflito UNIQUE)
    async atualizar(evento) {
        const db = await this.dbPromise();
        const timesJson = JSON.stringify(evento.times);
        
        await db.run(
            `UPDATE eventos SET 
             codigo = ?, nome = ?, aberto = ?, vencedor = ?, status = ?, finalizadoEm = ?, times = ? 
             WHERE id = ?`,
            [
                evento.codigo,
                evento.nome,
                evento.aberto ? 1 : 0, 
                evento.vencedor, 
                evento.status, 
                evento.finalizadoEm, 
                timesJson, 
                evento.id
            ]
        );
    }

    // 3. Fallback inteligente exigido pelos Use Cases mais antigos
    async salvar(evento) {
        const existente = await this.buscarPorId(evento.id);
        if (existente) {
            await this.atualizar(evento);
        } else {
            await this.criar(evento);
        }
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

    async obterEventoAtivo() {
        const db = await this.dbPromise();
        const row = await db.get("SELECT * FROM eventos WHERE status = 'ativo' LIMIT 1");
        if (!row) return null;
        return this._mapToEntity(row);
    }

    // Alias necessário para a Clean Architecture
    async buscarEventoAtivo() {
        return await this.obterEventoAtivo();
    }

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