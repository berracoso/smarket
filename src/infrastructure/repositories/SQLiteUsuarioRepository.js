/**
 * Implementação concreta do repositório de usuários usando SQLite
 * Implementa IUsuarioRepository do Domain Layer
 */

const IUsuarioRepository = require('../../domain/repositories/IUsuarioRepository');
const Usuario = require('../../domain/entities/Usuario');
const Email = require('../../domain/value-objects/Email');

class SQLiteUsuarioRepository extends IUsuarioRepository {
    constructor(database) {
        super();
        this.db = database;
    }

    /**
     * Busca usuário por ID
     * @param {number} id 
     * @returns {Promise<Usuario|null>}
     */
    async buscarPorId(id) {
        const row = await this.db.get('SELECT * FROM usuarios WHERE id = ?', [id]);
        
        if (!row) return null;
        
        return this._mapRowToEntity(row);
    }

    /**
     * Busca usuário por email
     * @param {string} email 
     * @returns {Promise<Usuario|null>}
     */
    async buscarPorEmail(email) {
        const emailNormalizado = email.toLowerCase().trim();
        const row = await this.db.get('SELECT * FROM usuarios WHERE email = ?', [emailNormalizado]);
        
        if (!row) return null;
        
        return this._mapRowToEntity(row);
    }

    /**
     * Cria novo usuário
     * @param {Usuario} usuario 
     * @returns {Promise<number>} ID do usuário criado
     */
    async criar(usuario) {
        const sql = `
            INSERT INTO usuarios (nome, email, senha, isAdmin, isSuperAdmin, tipo, criadoEm)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            usuario.nome,
            usuario.email.toString(),
            usuario.senha, // Já deve estar hasheada
            usuario.isAdmin ? 1 : 0,
            usuario.isSuperAdmin ? 1 : 0,
            usuario.tipo,
            usuario.criadoEm
        ];

        const result = await this.db.run(sql, params);
        return result.lastID;
    }

    /**
     * Atualiza usuário existente
     * @param {Usuario} usuario 
     * @returns {Promise<boolean>} true se atualizou
     */
    async atualizar(usuario) {
        const sql = `
            UPDATE usuarios 
            SET nome = ?, email = ?, isAdmin = ?, isSuperAdmin = ?, tipo = ?
            WHERE id = ?
        `;

        const params = [
            usuario.nome,
            usuario.email.toString(),
            usuario.isAdmin ? 1 : 0,
            usuario.isSuperAdmin ? 1 : 0,
            usuario.tipo,
            usuario.id
        ];

        const result = await this.db.run(sql, params);
        return result.changes > 0;
    }

    /**
     * Lista todos os usuários
     * @returns {Promise<Usuario[]>}
     */
    async listarTodos() {
        const rows = await this.db.all('SELECT * FROM usuarios ORDER BY criadoEm DESC');
        return rows.map(row => this._mapRowToEntity(row));
    }

    /**
     * Exclui usuário
     * @param {number} id 
     * @returns {Promise<boolean>}
     */
    async excluir(id) {
        const result = await this.db.run('DELETE FROM usuarios WHERE id = ?', [id]);
        return result.changes > 0;
    }

    /**
     * Mapeia linha do banco para entidade Usuario
     * @private
     */
    _mapRowToEntity(row) {
        return new Usuario({
            id: row.id,
            nome: row.nome,
            email: new Email(row.email),
            senha: row.senha, // hash
            isAdmin: row.isAdmin === 1,
            isSuperAdmin: row.isSuperAdmin === 1,
            tipo: row.tipo,
            criadoEm: row.criadoEm
        });
    }
}

module.exports = SQLiteUsuarioRepository;
