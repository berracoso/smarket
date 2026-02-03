/**
 * Configuração e gerenciamento de sessões
 * Encapsula express-session e suas configurações
 */

const session = require('express-session');

class SessionManager {
    constructor(config = {}) {
        this.config = {
            secret: config.secret || 'bolao-privado-secret-key-2026',
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: config.secure || false, // true em produção com HTTPS
                httpOnly: true,
                maxAge: config.maxAge || 24 * 60 * 60 * 1000 // 24 horas
            },
            name: config.name || 'bolao.sid'
        };
    }

    /**
     * Retorna middleware do express-session configurado
     * @returns {Function}
     */
    getMiddleware() {
        return session(this.config);
    }

    /**
     * Cria sessão para usuário
     * @param {Object} req - Request do Express
     * @param {number} userId 
     * @param {Object} userData 
     */
    criarSessao(req, userId, userData = {}) {
        req.session.userId = userId;
        req.session.usuario = {
            id: userId,
            nome: userData.nome,
            email: userData.email,
            tipo: userData.tipo,
            isAdmin: userData.isAdmin || false,
            isSuperAdmin: userData.isSuperAdmin || false
        };
    }

    /**
     * Obtém dados do usuário da sessão
     * @param {Object} req 
     * @returns {Object|null}
     */
    obterUsuario(req) {
        return req.session?.usuario || null;
    }

    /**
     * Verifica se usuário está autenticado
     * @param {Object} req 
     * @returns {boolean}
     */
    estaAutenticado(req) {
        return !!req.session?.userId;
    }

    /**
     * Destrói sessão (logout)
     * @param {Object} req 
     * @returns {Promise<void>}
     */
    destruirSessao(req) {
        return new Promise((resolve, reject) => {
            req.session.destroy((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Regenera ID da sessão (previne session fixation)
     * @param {Object} req 
     * @returns {Promise<void>}
     */
    regenerarSessao(req) {
        return new Promise((resolve, reject) => {
            req.session.regenerate((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}

module.exports = SessionManager;
