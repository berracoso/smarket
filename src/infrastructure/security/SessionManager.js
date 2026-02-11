const jwt = require('jsonwebtoken');

class SessionManager {
  constructor() {
    this.secret = process.env.JWT_SECRET || 'smarket-secret-key-2026';
    this.expiresIn = '1d';
  }

  /**
   * Cria um Token JWT para o usuário
   */
  criarSessao(usuario) {
    if (!usuario || !usuario.id) {
        throw new Error('Usuário inválido para criação de token');
    }
    
    const payload = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email.endereco || usuario.email,
      tipo: usuario.tipo
    };

    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  /**
   * Verifica se o token é válido
   */
  verificarToken(token) {
    try {
      return jwt.verify(token, this.secret);
    } catch (err) {
      throw new Error('Token inválido ou expirado');
    }
  }
}

module.exports = SessionManager;