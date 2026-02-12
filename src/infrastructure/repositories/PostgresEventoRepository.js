const IEventoRepository = require('../../domain/repositories/IEventoRepository');
const Evento = require('../../domain/entities/Evento');

class PostgresEventoRepository extends IEventoRepository {
    constructor(database) {
        super();
        this.db = database;
    }

    async buscarAtivo() {
        // Busca o último evento criado que ainda esteja aberto
        const sql = 'SELECT * FROM eventos WHERE status = $1 ORDER BY criadoEm DESC LIMIT 1';
        const res = await this.db.query(sql, ['aberto']);
        
        if (res.rows.length === 0) return null;
        return this._mapRowToEntity(res.rows[0]);
    }

    async criar(evento) {
        // CORREÇÃO: Postgres precisa de RETURNING id
        const sql = `
            INSERT INTO eventos (nome, status, times, criadoEm, atualizadoEm)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `;
        const params = [
            evento.nome,
            evento.status,
            JSON.stringify(evento.times), // Postgres armazena JSON como string ou tipo JSONB
            evento.criadoEm,
            evento.atualizadoEm
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
        const params = [
            evento.status,
            JSON.stringify(evento.times),
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
        // Tratamento robusto para JSON (se o banco retornar string ou objeto)
        let timesObj = row.times;
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