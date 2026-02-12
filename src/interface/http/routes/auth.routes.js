const { Router } = require('express');

module.exports = ({ authController, authenticationMiddleware }) => {
  const router = Router();

  router.post('/registro', (req, res, next) => authController.registro(req, res, next));
  router.post('/login', (req, res, next) => authController.login(req, res, next));
  
  // Rota de Logout (opcional em JWT, mas mantemos para compatibilidade)
  router.post('/logout', (req, res) => {
      res.status(200).json({ mensagem: 'Logout realizado com sucesso' });
  });

  // Rota protegida para pegar dados do usuário logado
  // O uso de .requireAuth() agora funcionará porque adicionamos o método na classe acima
  router.get('/me', authenticationMiddleware.requireAuth(), (req, res, next) => authController.me(req, res, next));

  return router;
};