const IApostaRepository = require('../../domain/repositories/IApostaRepository');
const Aposta = require('../../domain/entities/Aposta');
const ValorAposta = require('../../domain/value-objects/ValorAposta');

class PostgresApostaRepository extends IApostaRepository {
    constructor(database) {
        super();
        this.db = database;
    }

    async buscarPorId(id) {
        const res = await this.db.query('SELECT * FROM apostas WHERE id = $1', [id]);
        if (res.rows.length === 0) return null;
        return this._mapRowToEntity(res.rows[0]);
    }

    async criar(aposta) {
        const sql = `
            INSERT INTO apostas (userId, eventoId, nome, time, valor, timestamp)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `;
        const params = [
            aposta.userId,
            aposta.eventoId,
            aposta.nome,
            aposta.time,
            aposta.getValorNumerico(),
            aposta.timestamp
        ];
        const res = await this.db.query(sql, params);
        return res.rows[0].id;
    }

    async listarPorUsuarioEEvento(userId, eventoId) {
        const sql = 'SELECT * FROM apostas WHERE userId = $1 AND eventoId = $2 ORDER BY timestamp DESC';
        const res = await this.db.query(sql, [userId, eventoId]);
        return res.rows.map(row => this._mapRowToEntity(row));
    }

    async listarPorEvento(eventoId) {
        const sql = 'SELECT * FROM apostas WHERE eventoId = $1 ORDER BY timestamp DESC';
        const res = await this.db.query(sql, [eventoId]);
        return res.rows.map(row => this._mapRowToEntity(row));
    }

    async listarPorUsuario(userId, filtros = {}) {
        let sql = 'SELECT * FROM apostas WHERE userId = $1';
        const params = [userId];
        let paramCount = 1;

        if (filtros.eventoId) {
            paramCount++;
            sql += ` AND eventoId = $${paramCount}`;
            params.push(filtros.eventoId);
        }

        sql += ' ORDER BY timestamp DESC';

        if (filtros.limite) {
            paramCount++;
            sql += ` LIMIT $${paramCount}`;
            params.push(filtros.limite);
        }

        const res = await this.db.query(sql, params);
        return res.rows.map(row => this._mapRowToEntity(row));
    }

    async calcularTotalPorTime(eventoId, time) {
        const sql = 'SELECT COALESCE(SUM(valor), 0) as total FROM apostas WHERE eventoId = $1 AND time = $2';
        const res = await this.db.query(sql, [eventoId, time]);
        // Postgres retorna SUM como string para evitar overflow, precisamos converter
        return res.rows[0] ? Number(res.rows[0].total) : 0;
    }

    async calcularTotalArrecadado(eventoId) {
        const sql = 'SELECT COALESCE(SUM(valor), 0) as total FROM apostas WHERE eventoId = $1';
        const res = await this.db.query(sql, [eventoId]);
        return res.rows[0] ? Number(res.rows[0].total) : 0;
    }

    async contarPorEvento(eventoId) {
        const sql = 'SELECT COUNT(*) as total FROM apostas WHERE eventoId = $1';
        const res = await this.db.query(sql, [eventoId]);
        return res.rows[0] ? Number(res.rows[0].total) : 0;
    }

    async obterResumoPorTime(eventoId) {
        const sql = `
            SELECT 
                time,
                COUNT(*) as quantidadeApostas,
                SUM(valor) as totalApostado
            FROM apostas
            WHERE eventoId = $1
            GROUP BY time
            ORDER BY totalApostado DESC
        `;
        const res = await this.db.query(sql, [eventoId]);
        // Converter strings numéricas do Postgres de volta para numeros
        return res.rows.map(r => ({
            ...r,
            totalapostado: Number(r.totalapostado || r.totalApostado)
        }));
    }

    _mapRowToEntity(row) {
        return new Aposta({
            id: row.id,
            userId: row.userid || row.userId, // Postgres retorna minúsculo
            eventoId: row.eventoid || row.eventoId,
            eventoNome: row.eventonome || row.eventoNome || '',
            nome: row.nome,
            time: row.time,
            valor: new ValorAposta(Number(row.valor)),
            timestamp: row.timestamp // Postgres retorna objeto Date ou string ISO
        });
    }
}

module.exports = PostgresApostaRepository;