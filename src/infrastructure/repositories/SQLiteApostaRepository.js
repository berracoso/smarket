const Aposta = require('../../domain/entities/Aposta');

class SQLiteApostaRepository {
    constructor(dbPromise) {
        this.dbPromise = dbPromise;
    }

    async salvar(aposta) {
        const db = await this.dbPromise();
        await db.run(
            `INSERT INTO apostas (id, userId, eventoId, nome, time, valor, timestamp) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                aposta.id, aposta.userId, aposta.eventoId, aposta.nome, 
                aposta.time, aposta.getValorNumerico(), aposta.timestamp
            ]
        );
    }

    async listarPorEvento(eventoId) {
        const db = await this.dbPromise();
        const rows = await db.all('SELECT * FROM apostas WHERE eventoId = ?', [eventoId]);
        return rows.map(row => this._mapToEntity(row));
    }

    async listarPorUsuario(userId) {
        const db = await this.dbPromise();
        const rows = await db.all('SELECT * FROM apostas WHERE userId = ? ORDER BY timestamp DESC', [userId]);
        return rows.map(row => this._mapToEntity(row));
    }

    _mapToEntity(row) {
        return new Aposta({
            id: row.id,
            userId: row.userId,
            eventoId: row.eventoId,
            nome: row.nome,
            time: row.time,
            valor: row.valor,
            timestamp: row.timestamp
        });
    }
}

module.exports = SQLiteApostaRepository;