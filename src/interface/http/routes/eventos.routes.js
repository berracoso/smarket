const { Router } = require('express');

module.exports = ({ eventosController, authenticationMiddleware, authorizationMiddleware }) => {
  const router = Router();

  // Rota Pública (mas com suporte a usuário logado se houver token)
  // Isso permite que o frontend saiba se o usuário já apostou neste evento, por exemplo
  router.get('/ativo', 
      authenticationMiddleware.optionalAuth(), 
      (req, res, next) => eventosController.obterAtivo(req, res, next)
  );

  // Rotas Protegidas (Apenas Admin)
  router.post('/', 
      authenticationMiddleware.requireAuth(), 
      authorizationMiddleware.isAdmin(), 
      (req, res, next) => eventosController.criar(req, res, next)
  );

  router.post('/fechar', 
      authenticationMiddleware.requireAuth(), 
      authorizationMiddleware.isAdmin(), 
      (req, res, next) => eventosController.fecharApostas(req, res, next)
  );
  
  router.post('/vencedor', 
      authenticationMiddleware.requireAuth(), 
      authorizationMiddleware.isAdmin(), 
      (req, res, next) => eventosController.definirVencedor(req, res, next)
  );

  // Rota para resetar evento (Super Admin)
  router.post('/reset', 
      authenticationMiddleware.requireAuth(), 
      authorizationMiddleware.isSuperAdmin(), 
      (req, res, next) => eventosController.resetar(req, res, next)
  );

  // Listagem geral (pode ser pública ou protegida, dependendo da regra de negócio)
  // Vamos deixar pública por enquanto
  router.get('/', (req, res, next) => eventosController.listar(req, res, next));

  return router;
};