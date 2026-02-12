class AuthenticationMiddleware {
  constructor(sessionManager) {
    this.sessionManager = sessionManager;
    // Garante que o 'this' se refere à instância da classe
    this.verificar = this.verificar.bind(this);
  }

  verificar(req, res, next) {
    try {
      // 1. Tentar pegar do header Authorization (Padrão mais comum)
      let token = req.headers['authorization'];

      // 2. Fallback para x-access-token (Legado)
      if (!token) {
        token = req.headers['x-access-token'];
      }

      // 3. Limpeza do prefixo "Bearer " se existir
      if (token && token.startsWith('Bearer ')) {
        // Remove os primeiros 7 caracteres ("Bearer ")
        token = token.slice(7, token.length).trim();
      }

      // Se ainda não tiver token, retorna erro
      if (!token) {
        return res.status(401).json({ 
          erro: 'Acesso negado. Token não fornecido.',
          tipo: 'auth_required' 
        });
      }

      // 4. Verificar validade do token usando o SessionManager
      const decoded = this.sessionManager.verificarToken(token);
      
      // 5. Anexar usuário decodificado à requisição
      req.usuario = decoded;
      
      next();
    } catch (error) {
      console.error('Erro de autenticação:', error.message);
      return res.status(401).json({ 
        erro: 'Token inválido ou expirado.',
        tipo: 'auth_required'
      });
    }
  }
}

module.exports = AuthenticationMiddleware;