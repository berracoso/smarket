const { Router } = require('express');
const authRoutes = require('./auth.routes');
const eventosRoutes = require('./eventos.routes');
const apostasRoutes = require('./apostas.routes');
const usersRoutes = require('./users.routes'); // Se existir

const router = Router();

// Health Check
router.get('/health', (req, res) => res.send('OK'));

// Rotas de Autenticação
router.use('/auth', authRoutes);

// Rotas de Eventos (Públicas e Privadas mistas, tratadas dentro do router)
router.use('/eventos', eventosRoutes);

// Rotas de Apostas
router.use('/apostas', apostasRoutes);

// Rotas de Usuários (Admin)
// Verifica se o arquivo existe antes de carregar para não dar erro
if (usersRoutes) {
    router.use('/users', usersRoutes);
}

// Rota de compatibilidade para o frontend antigo se necessário
router.use('/minhas-apostas', (req, res) => {
    // Redireciona internamente para a nova rota padronizada
    res.redirect(307, '/apostas/minhas'); 
});

module.exports = router;