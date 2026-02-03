/**
 * Implementação concreta do repositório de eventos usando SQLite
 * Implementa IEventoRepository do Domain Layer
 */

const IEventoRepository = require('../../domain/repositories/IEventoRepository');
const Evento = require('../../domain/entities/Evento');

class SQLiteEventoRepository extends IEventoRepository {
    constructor(database) {
        super();
        this.db = database;
    }

    /**
     * Busca evento por ID
     * @param {number} id 
     * @returns {Promise<Evento|null>}
     */
    async buscarPorId(id) {
        const row = await this.db.get('SELECT * FROM eventos_historico WHERE id = ?', [id]);
        
        if (!row) return null;
        
        return this._mapRowToEntity(row);
    }

    /**
     * Busca evento ativo (apenas 1 por vez)
     * @returns {Promise<Evento|null>}
     */
    async buscarEventoAtivo() {
        const row = await this.db.get(
            'SELECT * FROM eventos_historico WHERE status = ? ORDER BY id DESC LIMIT 1', 
            ['ativo']
        );
        
        if (!row) return null;
        
        return this._mapRowToEntity(row);
    }

    /**
     * Cria novo evento
     * @param {Evento} evento 
     * @returns {Promise<number>} ID do evento criado
     */
    async criar(evento) {
        // Primeiro, arquiva eventos ativos anteriores
        await this.db.run('UPDATE eventos_historico SET status = ? WHERE status = ?', ['arquivado', 'ativo']);

        const sql = `
            INSERT INTO eventos_historico (codigo, nome, times, aberto, status, vencedor, criadoEm)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            evento.codigo,
            evento.nome,
            JSON.stringify(evento.times),
            evento.aberto ? 1 : 0,
            evento.status,
            evento.vencedor,
            evento.criadoEm
        ];

        const result = await this.db.run(sql, params);
        return result.lastID;
    }

    /**
     * Atualiza evento existente
     * @param {Evento} evento 
     * @returns {Promise<boolean>}
     */
    async atualizar(evento) {
        const sql = `
            UPDATE eventos_historico 
            SET aberto = ?, status = ?, vencedor = ?
            WHERE id = ?
        `;

        const params = [
            evento.aberto ? 1 : 0,
            evento.status,
            evento.vencedor,
            evento.id
        ];

        const result = await this.db.run(sql, params);
        return result.changes > 0;
    }

    /**
     * Finaliza evento (altera status)
     * @param {number} id 
     * @returns {Promise<boolean>}
     */
    async finalizar(id) {
        const result = await this.db.run(
            'UPDATE eventos_historico SET status = ? WHERE id = ?',
            ['finalizado', id]
        );
        return result.changes > 0;
    }

    /**
     * Arquiva evento
     * @param {number} id 
     * @returns {Promise<boolean>}
     */
    async arquivar(id) {
        const result = await this.db.run(
            'UPDATE eventos_historico SET status = ? WHERE id = ?',
            ['arquivado', id]
        );
        return result.changes > 0;
    }

    /**
     * Salva evento no histórico
     * Como a tabela eventos_historico já contém o evento (com status atualizado),
     * apenas retornamos o ID do evento finalizado
     * @param {Evento} evento 
     * @param {number} totalArrecadado 
     * @param {number} totalPremios 
     * @returns {Promise<number>}
     */
    async salvarHistorico(evento, totalArrecadado, totalPremios) {
        // O evento já foi atualizado com status 'finalizado'
        // e vencedor definido, não precisamos inserir novamente
        return evento.id;
    }

    /**
     * Lista histórico de eventos finalizados
     * @param {number} limite 
     * @returns {Promise<Array>}
     */
    async listarHistorico(limite = 50) {
        const sql = `
            SELECT * FROM eventos_historico 
            ORDER BY finalizadoEm DESC 
            LIMIT ?
        `;
        
        return await this.db.all(sql, [limite]);
    }

    /**
     * Mapeia linha do banco para entidade Evento
     * @private
     */
    _mapRowToEntity(row) {
        return new Evento({
            id: row.id,
            codigo: row.codigo,
            nome: row.nome,
            times: JSON.parse(row.times),
            aberto: row.aberto === 1,
            status: row.status,
            vencedor: row.vencedor,
            criadoEm: row.criadoEm
        });
    }
}

module.exports = SQLiteEventoRepository;
