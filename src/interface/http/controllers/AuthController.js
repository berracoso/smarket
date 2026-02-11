class AuthController {
  constructor(registrarUsuario, fazerLogin, sessionManager) {
    this.registrarUsuario = registrarUsuario;
    this.fazerLogin = fazerLogin;
    this.sessionManager = sessionManager; 
  }

  async registro(req, res, next) {
    try {
      const { nome, email, senha } = req.body;
      
      const usuario = await this.registrarUsuario.executar({ nome, email, senha });

      const token = this.sessionManager.criarSessao(usuario);

      res.status(201).json({
        mensagem: 'Usuário registrado com sucesso',
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email.endereco || usuario.email,
          tipo: usuario.tipo
        },
        token
      });
    } catch (erro) {
      next(erro);
    }
  }

  async login(req, res, next) {
    try {
      const { email, senha } = req.body;

      const usuario = await this.fazerLogin.executar({ email, senha });

      // O erro "undefined" acontecia aqui antes
      const token = this.sessionManager.criarSessao(usuario);

      res.status(200).json({
        mensagem: 'Login realizado com sucesso',
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email.endereco || usuario.email,
          tipo: usuario.tipo
        },
        token
      });
    } catch (erro) {
      next(erro);
    }
  }

  async me(req, res, next) {
    try {
      const usuario = req.usuario;
      
      if (!usuario) {
        return res.status(401).json({ erro: 'Usuário não autenticado' });
      }

      res.status(200).json({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo
      });
    } catch (erro) {
      next(erro);
    }
  }
}

module.exports = AuthController;