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
        // CORREÇÃO: Garante que estamos pegando a string do email
        // O ValueObject Email pode ser passado inteiro, então pegamos .endereco ou ele mesmo
        const emailString = email.endereco || email; 
        
        // Normaliza para minúsculo e remove espaços
        const emailNormalizado = String(emailString).toLowerCase().trim();
        
        const res = await this.db.query('SELECT * FROM usuarios WHERE email = $1', [emailNormalizado]);
        if (res.rows.length === 0) return null;
        return this._mapRowToEntity(res.rows[0]);
    }

    async criar(usuario) {
        const sql = `
            INSERT INTO usuarios (nome, email, senha, isAdmin, isSuperAdmin, tipo, criadoEm)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        `;
        const params = [
            usuario.nome,
            usuario.email.toString(),
            usuario.senha,
            usuario.isAdmin ? 1 : 0,
            usuario.isSuperAdmin ? 1 : 0,
            usuario.tipo,
            usuario.criadoEm
        ];
        const res = await this.db.query(sql, params);
        return res.rows[0].id;
    }

    async atualizar(usuario) {
        const sql = `
            UPDATE usuarios 
            SET nome = $1, email = $2, isAdmin = $3, isSuperAdmin = $4, tipo = $5
            WHERE id = $6
        `;
        const params = [
            usuario.nome,
            usuario.email.toString(),
            usuario.isAdmin ? 1 : 0,
            usuario.isSuperAdmin ? 1 : 0,
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
        // CORREÇÃO: O PostgreSQL retorna colunas em minúsculo (ex: isadmin em vez de isAdmin)
        // Precisamos verificar as duas formas para garantir
        return new Usuario({
            id: row.id,
            nome: row.nome,
            email: new Email(row.email),
            senha: row.senha,
            // Verifica se é true (booleano) ou 1 (inteiro)
            isAdmin: (row.isadmin === true || row.isadmin === 1),
            isSuperAdmin: (row.issuperadmin === true || row.issuperadmin === 1),
            tipo: row.tipo,
            criadoEm: row.criadoem || row.criadoEm // Tenta minúsculo (Postgres) ou camelCase
        });
    }
}

module.exports = PostgresUsuarioRepository;