class AuthController {
  constructor(registrarUsuario, fazerLogin, sessionManager) {
    this.registrarUsuario = registrarUsuario;
    this.fazerLogin = fazerLogin;
    this.sessionManager = sessionManager; 
  }

  async registro(req, res, next) {
    try {
      const { nome, email, senha } = req.body;
      
      // Validação básica de entrada
      if (!nome || !email || !senha) {
          return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
      }

      const resultado = await this.registrarUsuario.executar({ nome, email, senha });
      
      // Robustez: Garante que pegamos o objeto usuário corretamente
      const usuario = resultado.usuario || resultado;

      if (!usuario || !usuario.id) {
          throw new Error('Falha ao registrar usuário: Retorno inválido do caso de uso.');
      }

      const token = this.sessionManager.criarSessao(usuario);

      res.status(201).json({
        mensagem: 'Usuário registrado com sucesso',
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email.endereco || usuario.email, // Suporta VO ou string
          tipo: usuario.tipo,
          isAdmin: usuario.isAdmin
        },
        token
      });
    } catch (erro) {
      // Passa para o error-handler global
      next(erro);
    }
  }

  async login(req, res, next) {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
          return res.status(400).json({ erro: 'Email e senha são obrigatórios.' });
      }

      const resultado = await this.fazerLogin.executar({ email, senha });
      
      // O UseCase FazerLogin retorna { sucesso: true, usuario: ... }
      const usuario = resultado.usuario;

      const token = this.sessionManager.criarSessao(usuario);

      res.status(200).json({
        mensagem: 'Login realizado com sucesso',
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email.endereco || usuario.email,
          tipo: usuario.tipo,
          isAdmin: usuario.isAdmin
        },
        token
      });
    } catch (erro) {
      // Se for erro de credenciais, retornamos 401 explicitamente se o erro não tiver status
      if (erro.message === 'Credenciais inválidas') {
          return res.status(401).json({ erro: 'Email ou senha incorretos.' });
      }
      next(erro);
    }
  }

  async me(req, res, next) {
    try {
      // req.usuario é populado pelo AuthenticationMiddleware via Token
      const usuario = req.usuario;
      
      if (!usuario) {
        return res.status(401).json({ erro: 'Token inválido ou não fornecido.' });
      }

      res.status(200).json({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo,
        isAdmin: usuario.isAdmin
      });
    } catch (erro) {
      next(erro);
    }
  }
}

module.exports = AuthController;