const IEventoRepository = require('../../domain/repositories/IEventoRepository');
const Evento = require('../../domain/entities/Evento');

class PostgresEventoRepository extends IEventoRepository {
    constructor(database) {
        super();
        this.db = database;
    }

    async buscarAtivo() {
        const sql = 'SELECT * FROM eventos WHERE status = $1 ORDER BY criadoEm DESC LIMIT 1';
        const res = await this.db.query(sql, ['aberto']);
        
        if (res.rows.length === 0) return null;
        return this._mapRowToEntity(res.rows[0]);
    }

    async criar(evento) {
        const sql = `
            INSERT INTO eventos (nome, status, times, criadoEm, atualizadoEm, vencedor)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `;
        
        // Garante que 'times' seja uma string JSON válida ou objeto
        const timesJson = typeof evento.times === 'string' ? evento.times : JSON.stringify(evento.times);

        const params = [
            evento.nome,
            evento.status,
            timesJson, 
            evento.criadoEm,
            evento.atualizadoEm,
            evento.vencedor || null
        ];

        const res = await this.db.query(sql, params);
        return res.rows[0].id;
    }

    async atualizar(evento) {
        const sql = `
            UPDATE eventos 
            SET status = $1, times = $2, vencedor = $3, atualizadoEm = $4
            WHERE id = $5
        `;
        
        const timesJson = typeof evento.times === 'string' ? evento.times : JSON.stringify(evento.times);

        const params = [
            evento.status,
            timesJson,
            evento.vencedor,
            evento.atualizadoEm,
            evento.id
        ];

        await this.db.query(sql, params);
        return true;
    }

    async buscarPorId(id) {
        const res = await this.db.query('SELECT * FROM eventos WHERE id = $1', [id]);
        if (res.rows.length === 0) return null;
        return this._mapRowToEntity(res.rows[0]);
    }

    async listarTodos() {
        const res = await this.db.query('SELECT * FROM eventos ORDER BY criadoEm DESC');
        return res.rows.map(row => this._mapRowToEntity(row));
    }

    _mapRowToEntity(row) {
        let timesObj = row.times;
        // Postgres pode retornar JSONB já como objeto ou JSON como string.
        if (typeof timesObj === 'string') {
            try { timesObj = JSON.parse(timesObj); } catch(e) { timesObj = {}; }
        }

        return new Evento({
            id: row.id,
            nome: row.nome,
            status: row.status,
            times: timesObj,
            vencedor: row.vencedor,
            criadoEm: row.criadoem || row.criadoEm,
            atualizadoEm: row.atualizadoem || row.atualizadoEm
        });
    }
}

module.exports = PostgresEventoRepository;