class AuthController {
  constructor(registrarUsuario, fazerLogin, sessionManager) {
    this.registrarUsuario = registrarUsuario;
    this.fazerLogin = fazerLogin;
    this.sessionManager = sessionManager; // <--- Faltava esta injeção
  }

  async registro(req, res, next) {
    try {
      const { nome, email, senha } = req.body;
      
      // Executa o caso de uso de registro
      const usuario = await this.registrarUsuario.executar({ nome, email, senha });

      // Cria a sessão (token JWT) logo após o registro
      const token = this.sessionManager.criarSessao(usuario);

      res.status(201).json({
        mensagem: 'Usuário registrado com sucesso',
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email.endereco,
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

      // Executa o caso de uso de login
      const usuario = await this.fazerLogin.executar({ email, senha });

      // Cria a sessão (token JWT)
      // O erro "Cannot read properties of undefined" acontecia aqui
      const token = this.sessionManager.criarSessao(usuario);

      res.status(200).json({
        mensagem: 'Login realizado com sucesso',
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email.endereco,
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
      // O usuário já está anexado ao request pelo middleware de autenticação
      const usuario = req.usuario;
      
      if (!usuario) {
        return res.status(401).json({ erro: 'Usuário não autenticado' });
      }

      res.status(200).json({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email, // Dependendo de como o middleware popula, pode ser usuario.email
        tipo: usuario.tipo
      });
    } catch (erro) {
      next(erro);
    }
  }
}

module.exports = AuthController;