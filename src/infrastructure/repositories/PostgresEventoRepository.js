const IEventoRepository = require('../../domain/repositories/IEventoRepository');
const Evento = require('../../domain/entities/Evento');

class PostgresEventoRepository extends IEventoRepository {
    constructor(database) {
        super();
        this.db = database;
    }

    async buscarPorId(id) {
        const res = await this.db.query('SELECT * FROM eventos_historico WHERE id = $1', [id]);
        if (res.rows.length === 0) return null;
        return this._mapRowToEntity(res.rows[0]);
    }

    async buscarEventoAtivo() {
        const res = await this.db.query(
            'SELECT * FROM eventos_historico WHERE status = $1 ORDER BY id DESC LIMIT 1', 
            ['ativo']
        );
        if (res.rows.length === 0) return null;
        return this._mapRowToEntity(res.rows[0]);
    }

    async criar(evento) {
        // Arquiva anteriores
        await this.db.query('UPDATE eventos_historico SET status = $1 WHERE status = $2', ['arquivado', 'ativo']);

        const sql = `
            INSERT INTO eventos_historico (codigo, nome, times, aberto, status, vencedor, criadoEm)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        `;

        const params = [
            evento.codigo,
            evento.nome,
            JSON.stringify(evento.times), // Salva como texto JSON
            evento.aberto ? 1 : 0,
            evento.status,
            evento.vencedor,
            evento.criadoEm
        ];

        const res = await this.db.query(sql, params);
        return res.rows[0].id;
    }

    async atualizar(evento) {
        const sql = `
            UPDATE eventos_historico 
            SET aberto = $1, status = $2, vencedor = $3
            WHERE id = $4
        `;
        const params = [
            evento.aberto ? 1 : 0,
            evento.status,
            evento.vencedor,
            evento.id
        ];
        const res = await this.db.query(sql, params);
        return res.rowCount > 0;
    }

    async finalizar(id) {
        const res = await this.db.query(
            'UPDATE eventos_historico SET status = $1 WHERE id = $2',
            ['finalizado', id]
        );
        return res.rowCount > 0;
    }

    async arquivar(id) {
        const res = await this.db.query(
            'UPDATE eventos_historico SET status = $1 WHERE id = $2',
            ['arquivado', id]
        );
        return res.rowCount > 0;
    }

    async salvarHistorico(evento, totalArrecadado, totalPremios) {
        return evento.id;
    }

    async listarHistorico(limite = 50) {
        const res = await this.db.query('SELECT * FROM eventos_historico ORDER BY finalizadoEm DESC LIMIT $1', [limite]);
        return res.rows;
    }

    _mapRowToEntity(row) {
        return new Evento({
            id: row.id,
            codigo: row.codigo,
            nome: row.nome,
            // Postgres retorna TEXT, então precisamos do JSON.parse igual no SQLite
            times: typeof row.times === 'string' ? JSON.parse(row.times) : row.times,
            aberto: row.aberto === 1 || row.aberto === true,
            status: row.status,
            vencedor: row.vencedor,
            criadoEm: row.criadoem
        });
    }
}

module.exports = PostgresEventoRepository;