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
        // CORREÇÃO: Postgres exige nomes de colunas exatos se não estiverem em minúsculo, 
        // mas aqui estamos usando os nomes criados no setup (que ficaram minúsculos/insensitivos).
        const sql = `
            INSERT INTO apostas (userId, eventoId, nome, time, valor, timestamp, ganhou, lucroReal)
            VALUES ($1, $2, $3, $4, $5, $6, 0, 0)
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
        // CORREÇÃO: Adicionado JOIN para buscar o nome do evento, essencial para o frontend
        const sql = `
            SELECT a.*, e.nome as nome_evento 
            FROM apostas a
            LEFT JOIN eventos_historico e ON a.eventoId = e.id
            WHERE a.userId = $1 AND a.eventoId = $2 
            ORDER BY a.timestamp DESC
        `;
        const res = await this.db.query(sql, [userId, eventoId]);
        return res.rows.map(row => this._mapRowToEntity(row));
    }

    async listarPorEvento(eventoId) {
        const sql = 'SELECT * FROM apostas WHERE eventoId = $1 ORDER BY timestamp DESC';
        const res = await this.db.query(sql, [eventoId]);
        return res.rows.map(row => this._mapRowToEntity(row));
    }

    async listarPorUsuario(userId, filtros = {}) {
        // CORREÇÃO CRÍTICA: Join com eventos_historico para trazer o nome do evento na lista "Minhas Apostas"
        let sql = `
            SELECT a.*, e.nome as nome_evento
            FROM apostas a
            LEFT JOIN eventos_historico e ON a.eventoId = e.id
            WHERE a.userId = $1
        `;
        const params = [userId];
        let paramCount = 1;

        if (filtros.eventoId) {
            paramCount++;
            sql += ` AND a.eventoId = $${paramCount}`;
            params.push(filtros.eventoId);
        }

        sql += ' ORDER BY a.timestamp DESC';

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
        return res.rows.map(r => ({
            ...r,
            // Postgres retorna SUM como string
            totalapostado: Number(r.totalapostado || r.totalApostado)
        }));
    }

    _mapRowToEntity(row) {
        // CORREÇÃO CRÍTICA: Postgres retorna todas colunas em minúsculo (userid, eventoid, lucroreal).
        // Se você tentar acessar row.userId ou row.lucroReal direto, vai dar undefined.
        return new Aposta({
            id: row.id,
            userId: row.userid || row.userId,
            eventoId: row.eventoid || row.eventoId,
            // Pega o nome do evento vindo do JOIN (nome_evento) ou tenta fallbacks
            eventoNome: row.nome_evento || row.eventonome || row.eventoNome || '',
            nome: row.nome,
            time: row.time,
            valor: new ValorAposta(Number(row.valor)),
            timestamp: row.timestamp,
            // CORREÇÃO: Adicionado mapeamento de ganhou e lucroReal que faltavam
            ganhou: (row.ganhou === 1 || row.ganhou === true),
            lucroReal: Number(row.lucroreal || row.lucroReal || 0)
        });
    }
}

module.exports = PostgresApostaRepository;