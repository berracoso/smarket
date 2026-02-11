/**
 * Middleware de Tratamento de Erros
 * Captura e formata erros de forma consistente
 */

class ErrorHandler {
    /**
     * Middleware global de tratamento de erros
     * Deve ser o último middleware registrado
     * @param {Error} erro 
     * @param {Request} req 
     * @param {Response} res 
     * @param {NextFunction} next 
     */
    static handle(erro, req, res, next) {
        // Log do erro (em produção, enviar para serviço de monitoramento)
        console.error('Erro capturado:', {
            mensagem: erro.message,
            stack: erro.stack,
            url: req.originalUrl,
            metodo: req.method,
            usuario: req.userId || 'Não autenticado'
        });

        // Erros de validação do Domain Layer
        if (this._isValidationError(erro)) {
            return res.status(400).json({
                sucesso: false,
                erro: erro.message,
                tipo: 'validation_error'
            });
        }

        // Erros de permissão
        if (this._isPermissionError(erro)) {
            return res.status(403).json({
                sucesso: false,
                erro: erro.message,
                tipo: 'permission_error'
            });
        }

        // Erros de não encontrado
        if (this._isNotFoundError(erro)) {
            return res.status(404).json({
                sucesso: false,
                erro: erro.message,
                tipo: 'not_found_error'
            });
        }

        // Erro genérico
        return res.status(500).json({
            sucesso: false,
            erro: process.env.NODE_ENV === 'production' 
                ? 'Erro interno do servidor' 
                : erro.message,
            tipo: 'internal_error'
        });
    }

    /**
     * Verifica se é erro de validação
     * @private
     */
    static _isValidationError(erro) {
        const validationKeywords = [
            'deve ter',
            'é obrigatório',
            'formato inválido',
            'mínimo',
            'máximo',
            'não pode',
            'inválido',
            'já cadastrado'
        ];

        return validationKeywords.some(keyword => 
            erro.message.toLowerCase().includes(keyword)
        );
    }

    /**
     * Verifica se é erro de permissão
     * @private
     */
    static _isPermissionError(erro) {
        const permissionKeywords = [
            'não pode',
            'acesso negado',
            'sem permissão',
            'apenas admin',
            'apenas super admin'
        ];

        return permissionKeywords.some(keyword => 
            erro.message.toLowerCase().includes(keyword)
        );
    }

    /**
     * Verifica se é erro de não encontrado
     * @private
     */
    static _isNotFoundError(erro) {
        const notFoundKeywords = [
            'não encontrado',
            'não existe',
            'nenhum evento ativo'
        ];

        return notFoundKeywords.some(keyword => 
            erro.message.toLowerCase().includes(keyword)
        );
    }
}

module.exports = ErrorHandler;
