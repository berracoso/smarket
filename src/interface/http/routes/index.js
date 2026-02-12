const { Router } = require('express');
const authRoutes = require('./auth.routes');
const eventosRoutes = require('./eventos.routes');
const apostasRoutes = require('./apostas.routes');

// Carregamento seguro das rotas de usuário
let usersRoutes;
try {
    usersRoutes = require('./users.routes');
} catch (error) {
    console.warn('⚠️ users.routes.js não encontrado ou com erro. Rotas de usuário desativadas.');
}

const router = Router();

// Health Check
router.get('/health', (req, res) => res.send('OK'));

// Rotas da API
router.use('/auth', authRoutes);
router.use('/eventos', eventosRoutes);
router.use('/apostas', apostasRoutes);

if (usersRoutes) {
    router.use('/users', usersRoutes);
}

// Rota de compatibilidade
router.use('/minhas-apostas', (req, res) => res.redirect(307, '/apostas/minhas'));

module.exports = router;