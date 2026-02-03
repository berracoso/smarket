/**
 * Implementação concreta do repositório de apostas usando SQLite
 * Implementa IApostaRepository do Domain Layer
 */

const IApostaRepository = require('../../domain/repositories/IApostaRepository');
const Aposta = require('../../domain/entities/Aposta');
const ValorAposta = require('../../domain/value-objects/ValorAposta');

class SQLiteApostaRepository extends IApostaRepository {
    constructor(database) {
        super();
        this.db = database;
    }

    /**
     * Busca aposta por ID
     * @param {number} id 
     * @returns {Promise<Aposta|null>}
     */
    async buscarPorId(id) {
        const row = await this.db.get('SELECT * FROM apostas WHERE id = ?', [id]);
        
        if (!row) return null;
        
        return this._mapRowToEntity(row);
    }

    /**
     * Cria nova aposta
     * @param {Aposta} aposta 
     * @returns {Promise<number>} ID da aposta criada
     */
    async criar(aposta) {
        const sql = `
            INSERT INTO apostas (userId, eventoId, nome, time, valor, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const params = [
            aposta.userId,
            aposta.eventoId,
            aposta.nome,
            aposta.time,
            aposta.getValorNumerico(),
            aposta.timestamp
        ];

        const result = await this.db.run(sql, params);
        return result.lastID;
    }

    /**
     * Lista apostas de um usuário em um evento específico
     * @param {number} userId 
     * @param {number} eventoId 
     * @returns {Promise<Aposta[]>}
     */
    async listarPorUsuarioEEvento(userId, eventoId) {
        const sql = `
            SELECT * FROM apostas 
            WHERE userId = ? AND eventoId = ?
            ORDER BY timestamp DESC
        `;
        
        const rows = await this.db.all(sql, [userId, eventoId]);
        return rows.map(row => this._mapRowToEntity(row));
    }

    /**
     * Lista todas as apostas de um evento
     * @param {number} eventoId 
     * @returns {Promise<Aposta[]>}
     */
    async listarPorEvento(eventoId) {
        const sql = `
            SELECT * FROM apostas 
            WHERE eventoId = ?
            ORDER BY timestamp DESC
        `;
        
        const rows = await this.db.all(sql, [eventoId]);
        return rows.map(row => this._mapRowToEntity(row));
    }

    /**
     * Lista apostas de um usuário (todos os eventos)
     * @param {number} userId 
     * @param {Object} filtros 
     * @returns {Promise<Aposta[]>}
     */
    async listarPorUsuario(userId, filtros = {}) {
        let sql = 'SELECT * FROM apostas WHERE userId = ?';
        const params = [userId];

        if (filtros.eventoId) {
            sql += ' AND eventoId = ?';
            params.push(filtros.eventoId);
        }

        if (filtros.time) {
            sql += ' AND time = ?';
            params.push(filtros.time);
        }

        // Filtro por data início
        if (filtros.dataInicio) {
            sql += ' AND timestamp >= ?';
            params.push(filtros.dataInicio);
        }

        // Filtro por data fim (adiciona 1 dia para incluir o dia inteiro)
        if (filtros.dataFim) {
            sql += ' AND timestamp <= ?';
            // Adiciona T23:59:59 para incluir o dia todo
            params.push(filtros.dataFim + 'T23:59:59.999Z');
        }

        sql += ' ORDER BY timestamp DESC';

        if (filtros.limite) {
            sql += ' LIMIT ?';
            params.push(filtros.limite);
        }

        const rows = await this.db.all(sql, params);
        return rows.map(row => this._mapRowToEntity(row));
    }

    /**
     * Calcula total apostado em um time específico
     * @param {number} eventoId 
     * @param {string} time 
     * @returns {Promise<number>}
     */
    async calcularTotalPorTime(eventoId, time) {
        const sql = `
            SELECT COALESCE(SUM(valor), 0) as total
            FROM apostas 
            WHERE eventoId = ? AND time = ?
        `;
        
        const row = await this.db.get(sql, [eventoId, time]);
        return row ? row.total : 0;
    }

    /**
     * Calcula total arrecadado em um evento
     * @param {number} eventoId 
     * @returns {Promise<number>}
     */
    async calcularTotalArrecadado(eventoId) {
        const sql = `
            SELECT COALESCE(SUM(valor), 0) as total
            FROM apostas 
            WHERE eventoId = ?
        `;
        
        const row = await this.db.get(sql, [eventoId]);
        return row ? row.total : 0;
    }

    /**
     * Conta número de apostas em um evento
     * @param {number} eventoId 
     * @returns {Promise<number>}
     */
    async contarPorEvento(eventoId) {
        const sql = `
            SELECT COUNT(*) as total
            FROM apostas 
            WHERE eventoId = ?
        `;
        
        const row = await this.db.get(sql, [eventoId]);
        return row ? row.total : 0;
    }

    /**
     * Obtém resumo de apostas por time em um evento
     * @param {number} eventoId 
     * @returns {Promise<Array>}
     */
    async obterResumoPorTime(eventoId) {
        const sql = `
            SELECT 
                time,
                COUNT(*) as quantidadeApostas,
                SUM(valor) as totalApostado
            FROM apostas
            WHERE eventoId = ?
            GROUP BY time
            ORDER BY totalApostado DESC
        `;
        
        return await this.db.all(sql, [eventoId]);
    }

    /**
     * Mapeia linha do banco para entidade Aposta
     * @private
     */
    _mapRowToEntity(row) {
        return new Aposta({
            id: row.id,
            userId: row.userId,
            eventoId: row.eventoId,
            eventoNome: row.eventoNome || '',
            nome: row.nome,
            time: row.time,
            valor: new ValorAposta(row.valor),
            timestamp: row.timestamp
        });
    }
}

module.exports = SQLiteApostaRepository;
