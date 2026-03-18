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

    async obterEventoAtivo() {
        const db = await this.dbPromise();
        const row = await db.get("SELECT * FROM eventos WHERE status = 'ativo' LIMIT 1");
        if (!row) return null;
        return this._mapToEntity(row);
    }

    async buscarPorId(id) {
        const db = await this.dbPromise();
        const row = await db.get('SELECT * FROM eventos WHERE id = ?', [id]);
        if (!row) return null;
        return this._mapToEntity(row);
    }

    _mapToEntity(row) {
        return new Evento({
            id: row.id,
            codigo: row.codigo,
            nome: row.nome,
            times: JSON.parse(row.times), // Parseando o JSON de volta para Array
            aberto: Boolean(row.aberto),
            vencedor: row.vencedor,
            status: row.status,
            criadoEm: row.criadoEm,
            finalizadoEm: row.finalizadoEm
        });
    }
}

module.exports = SQLiteEventoRepository;