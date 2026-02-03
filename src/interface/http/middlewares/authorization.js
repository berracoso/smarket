/**
 * Middleware de Autorização (RBAC)
 * Verifica permissões do usuário (Admin, Super Admin)
 */

const ValidadorPermissoes = require('../../../domain/services/ValidadorPermissoes');

class AuthorizationMiddleware {
    constructor(usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
        this.validador = new ValidadorPermissoes();
    }

    /**
     * Middleware para verificar se é Admin ou Super Admin
     * @returns {Function} Express middleware
     */
    requireAdmin() {
        return async (req, res, next) => {
            try {
                if (!req.userId) {
                    return res.status(401).json({
                        sucesso: false,
                        erro: 'Não autenticado'
                    });
                }

                const usuario = await this.usuarioRepository.buscarPorId(req.userId);
                if (!usuario) {
                    return res.status(401).json({
                        sucesso: false,
                        erro: 'Usuário não encontrado'
                    });
                }

                if (!this.validador.podeGerenciarEventos(usuario)) {
                    return res.status(403).json({
                        sucesso: false,
                        erro: 'Acesso negado. Apenas Admin e Super Admin podem acessar.'
                    });
                }

                // Anexar usuário ao request
                req.usuario = usuario;
                next();
            } catch (erro) {
                next(erro);
            }
        };
    }

    /**
     * Middleware para verificar se é Super Admin
     * @returns {Function} Express middleware
     */
    requireSuperAdmin() {
        return async (req, res, next) => {
            try {
                if (!req.userId) {
                    return res.status(401).json({
                        sucesso: false,
                        erro: 'Não autenticado'
                    });
                }

                const usuario = await this.usuarioRepository.buscarPorId(req.userId);
                if (!usuario) {
                    return res.status(401).json({
                        sucesso: false,
                        erro: 'Usuário não encontrado'
                    });
                }

                if (!usuario.isSuperAdmin) {
                    return res.status(403).json({
                        sucesso: false,
                        erro: 'Acesso negado. Apenas Super Admin pode acessar.'
                    });
                }

                req.usuario = usuario;
                next();
            } catch (erro) {
                next(erro);
            }
        };
    }

    /**
     * Middleware para verificar se usuário pode apostar
     * (Super Admin não pode apostar)
     * @returns {Function} Express middleware
     */
    canBet() {
        return async (req, res, next) => {
            try {
                if (!req.userId) {
                    return res.status(401).json({
                        sucesso: false,
                        erro: 'Não autenticado'
                    });
                }

                const usuario = await this.usuarioRepository.buscarPorId(req.userId);
                if (!usuario) {
                    return res.status(401).json({
                        sucesso: false,
                        erro: 'Usuário não encontrado'
                    });
                }

                if (!this.validador.podeApostar(usuario)) {
                    return res.status(403).json({
                        sucesso: false,
                        erro: 'Super Admin não pode apostar.'
                    });
                }

                req.usuario = usuario;
                next();
            } catch (erro) {
                next(erro);
            }
        };
    }
}

module.exports = AuthorizationMiddleware;
