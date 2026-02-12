const IUsuarioRepository = require('../../domain/repositories/IUsuarioRepository');
const Usuario = require('../../domain/entities/Usuario');
const Email = require('../../domain/value-objects/Email');

class PostgresUsuarioRepository extends IUsuarioRepository {
    constructor(database) {
        super();
        this.db = database;
    }

    async buscarPorId(id) {
        const res = await this.db.query('SELECT * FROM usuarios WHERE id = $1', [id]);
        if (res.rows.length === 0) return null;
        return this._mapRowToEntity(res.rows[0]);
    }

    async buscarPorEmail(email) {
        const emailString = email.endereco || email;
        const emailNormalizado = String(emailString).toLowerCase().trim();
        
        const res = await this.db.query('SELECT * FROM usuarios WHERE email = $1', [emailNormalizado]);
        if (res.rows.length === 0) return null;
        return this._mapRowToEntity(res.rows[0]);
    }

    async criar(usuario) {
        const emailParaSalvar = usuario.email.toString().toLowerCase().trim();
        
        const sql = `
            INSERT INTO usuarios (nome, email, senha, isAdmin, isSuperAdmin, tipo, criadoEm)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        `;
        // Postgres prefere true/false nativo em vez de 1/0, mas aceita ambos.
        // Convertendo para boolean nativo para garantir.
        const params = [
            usuario.nome,
            emailParaSalvar,
            usuario.senha,
            !!usuario.isAdmin, 
            !!usuario.isSuperAdmin,
            usuario.tipo,
            usuario.criadoEm
        ];
        const res = await this.db.query(sql, params);
        return res.rows[0].id;
    }

    async atualizar(usuario) {
        const emailParaSalvar = usuario.email.toString().toLowerCase().trim();

        const sql = `
            UPDATE usuarios 
            SET nome = $1, email = $2, isAdmin = $3, isSuperAdmin = $4, tipo = $5
            WHERE id = $6
        `;
        const params = [
            usuario.nome,
            emailParaSalvar,
            !!usuario.isAdmin,
            !!usuario.isSuperAdmin,
            usuario.tipo,
            usuario.id
        ];
        const res = await this.db.query(sql, params);
        return res.rowCount > 0;
    }

    async listarTodos() {
        const res = await this.db.query('SELECT * FROM usuarios ORDER BY criadoEm DESC');
        return res.rows.map(row => this._mapRowToEntity(row));
    }

    async excluir(id) {
        const res = await this.db.query('DELETE FROM usuarios WHERE id = $1', [id]);
        return res.rowCount > 0;
    }

    _mapRowToEntity(row) {
        // Mapeamento à prova de falhas (CamelCase ou lowercase)
        return new Usuario({
            id: row.id,
            nome: row.nome,
            email: new Email(row.email),
            senha: row.senha,
            isAdmin: (row.isadmin === true || row.isAdmin === true),
            isSuperAdmin: (row.issuperadmin === true || row.isSuperAdmin === true),
            tipo: row.tipo,
            criadoEm: row.criadoem || row.criadoEm
        });
    }
}

module.exports = PostgresUsuarioRepository;