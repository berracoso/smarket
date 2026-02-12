const IApostaRepository = require('../../domain/repositories/IApostaRepository');
const Aposta = require('../../domain/entities/Aposta');

class PostgresApostaRepository extends IApostaRepository {
    constructor(database) {
        super();
        this.db = database;
    }

    async criar(aposta) {
        const sql = `
            INSERT INTO apostas (usuarioId, eventoId, time, valor, oddNoMomento, criadoEm)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `;
        const params = [
            aposta.usuarioId,
            aposta.eventoId,
            aposta.time,
            aposta.valor,
            aposta.oddNoMomento,
            aposta.criadoEm
        ];

        const res = await this.db.query(sql, params);
        return res.rows[0].id;
    }

    async listarPorUsuario(usuarioId) {
        const sql = 'SELECT * FROM apostas WHERE usuarioId = $1 ORDER BY criadoEm DESC';
        const res = await this.db.query(sql, [usuarioId]);
        
        return res.rows.map(row => this._mapRowToEntity(row));
    }

    async listarPorEvento(eventoId) {
        const sql = 'SELECT * FROM apostas WHERE eventoId = $1';
        const res = await this.db.query(sql, [eventoId]);
        return res.rows.map(row => this._mapRowToEntity(row));
    }

    _mapRowToEntity(row) {
        return new Aposta({
            id: row.id,
            // Fallbacks para garantir leitura correta independente do driver
            usuarioId: row.usuarioid || row.usuarioId, 
            eventoId: row.eventoid || row.eventoId,
            time: row.time,
            valor: parseFloat(row.valor), // Garante número
            oddNoMomento: parseFloat(row.oddnomomento || row.oddNoMomento || 0),
            criadoEm: row.criadoem || row.criadoEm
        });
    }
}

module.exports = PostgresApostaRepository;