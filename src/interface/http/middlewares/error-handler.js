/**
 * Middleware global de tratamento de erros
 * Captura e formata erros de forma consistente para o frontend
 */
module.exports = (err, req, res, next) => {
    // Log do erro (não exibe stack em produção por segurança)
    console.error('❌ Erro capturado:', {
        mensagem: err.message,
        url: req.originalUrl,
        metodo: req.method,
        usuario: req.session?.userId || req.userId || 'Não autenticado'
    });

    // 1. Tratamento de Erros do Banco de Dados (SQLite)
    if (err.message && err.message.includes('SQLITE_CONSTRAINT')) {
        if (err.message.includes('UNIQUE')) {
            return res.status(400).json({
                erro: true,
                mensagem: 'Este registro já existe no sistema (ex: e-mail já cadastrado).',
                tipo: 'unique_constraint_error'
            });
        }
        return res.status(400).json({
            erro: true,
            mensagem: 'Erro de restrição no banco de dados.',
            tipo: 'sqlite_constraint_error'
        });
    }

    // 2. Erros com status code já definido nas rotas
    if (err.statusCode) {
        return res.status(err.statusCode).json({
            erro: true,
            mensagem: err.message,
            tipo: 'app_error'
        });
    }

    // 3. Detecção baseada nas palavras-chave do Domínio
    const msgLower = err.message ? err.message.toLowerCase() : '';
    
    const isValidationError = ['deve ter', 'é obrigatório', 'formato inválido', 'mínimo', 'máximo', 'não pode', 'inválido'].some(k => msgLower.includes(k));
    if (isValidationError) {
        return res.status(400).json({ erro: true, mensagem: err.message, tipo: 'validation_error' });
    }

    const isPermissionError = ['não pode', 'acesso negado', 'sem permissão', 'apenas admin', 'apenas super admin'].some(k => msgLower.includes(k));
    if (isPermissionError) {
        return res.status(403).json({ erro: true, mensagem: err.message, tipo: 'permission_error' });
    }

    const isNotFoundError = ['não encontrado', 'não existe', 'nenhum evento ativo'].some(k => msgLower.includes(k));
    if (isNotFoundError) {
        return res.status(404).json({ erro: true, mensagem: err.message, tipo: 'not_found_error' });
    }

    // 4. Fallback: Erro genérico (500)
    return res.status(500).json({
        erro: true,
        mensagem: process.env.NODE_ENV === 'production' ? 'Erro interno do servidor' : err.message,
        tipo: 'internal_error',
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    });
};