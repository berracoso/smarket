const crypto = require('crypto');
const Usuario = require('../../domain/entities/Usuario');

class SQLiteUsuarioRepository {
    constructor(dbPromise) {
        this.dbPromise = dbPromise; // Promessa da conexão
    }

    async criar(usuario) {
        const db = await this.dbPromise();
        
        // SQLite não gera UUID sozinho, então geramos aqui se não existir
        if (!usuario.id) {
            usuario.id = crypto.randomUUID();
        }

        await db.run(
            `INSERT INTO usuarios (id, nome, email, senha, isAdmin, isSuperAdmin, tipo, criadoEm) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                usuario.id, usuario.nome, usuario.email.toString(), usuario.senha.toString(), 
                usuario.isAdmin ? 1 : 0, usuario.isSuperAdmin ? 1 : 0, usuario.tipo, usuario.criadoEm
            ]
        );

        return usuario.id;
    }

    async salvar(usuario) {
        const db = await this.dbPromise();
        
        if (!usuario.id) {
            usuario.id = crypto.randomUUID();
        }

        await db.run(
            `INSERT INTO usuarios (id, nome, email, senha, isAdmin, isSuperAdmin, tipo, criadoEm) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET 
             nome = excluded.nome, isAdmin = excluded.isAdmin, isSuperAdmin = excluded.isSuperAdmin, tipo = excluded.tipo`,
            [
                usuario.id, usuario.nome, usuario.email.toString(), usuario.senha.toString(), 
                usuario.isAdmin ? 1 : 0, usuario.isSuperAdmin ? 1 : 0, usuario.tipo, usuario.criadoEm
            ]
        );
    }

    async buscarPorEmail(email) {
        const db = await this.dbPromise();
        const row = await db.get('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (!row) return null;
        return this._mapToEntity(row);
    }

    async buscarPorId(id) {
        const db = await this.dbPromise();
        const row = await db.get('SELECT * FROM usuarios WHERE id = ?', [id]);
        if (!row) return null;
        return this._mapToEntity(row);
    }

    _mapToEntity(row) {
        return new Usuario({
            id: row.id,
            nome: row.nome,
            email: row.email,
            senha: row.senha,
            isAdmin: Boolean(row.isAdmin),
            isSuperAdmin: Boolean(row.isSuperAdmin),
            tipo: row.tipo,
            criadoEm: row.criadoEm
        });
    }
}

module.exports = SQLiteUsuarioRepository;