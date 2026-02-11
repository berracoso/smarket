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
     * Requer Admin ou Super Admin
     */
    requireAdmin() {
        return async (req, res, next) => {
            try {
                if (!req.userId) {
                    return res.status(401).json({ erro: 'Não autenticado' });
                }

                // Busca dados atualizados do banco (para garantir permissão atual)
                const usuario = await this.usuarioRepository.buscarPorId(req.userId);
                if (!usuario) {
                    return res.status(401).json({ erro: 'Usuário não encontrado' });
                }

                if (!this.validador.podeGerenciarEventos(usuario)) {
                    return res.status(403).json({ erro: 'Acesso negado. Requer permissão de Admin.' });
                }

                req.usuarioFull = usuario; // Anexa usuário completo do banco
                next();
            } catch (erro) {
                next(erro);
            }
        };
    }

    /**
     * Permissão para apostar (Super Admin não pode)
     */
    canBet() {
        return async (req, res, next) => {
            try {
                if (!req.userId) {
                    return res.status(401).json({ erro: 'Não autenticado' });
                }

                const usuario = await this.usuarioRepository.buscarPorId(req.userId);
                if (!usuario) {
                    return res.status(401).json({ erro: 'Usuário não encontrado' });
                }

                if (!this.validador.podeApostar(usuario)) {
                    return res.status(403).json({ erro: 'Ação não permitida para este tipo de usuário.' });
                }

                req.usuarioFull = usuario;
                next();
            } catch (erro) {
                next(erro);
            }
        };
    }
}

module.exports = AuthorizationMiddleware;