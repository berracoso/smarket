const { Router } = require('express');
const authRoutes = require('./auth.routes');
const eventosRoutes = require('./eventos.routes');
const apostasRoutes = require('./apostas.routes');
const container = require('../../../infrastructure/config/container'); // Importa o container

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

// Rotas da API Principais
router.use('/auth', authRoutes);
router.use('/eventos', eventosRoutes);
router.use('/apostas', apostasRoutes);

if (usersRoutes) {
    router.use('/users', usersRoutes);
}

// --- CORREÇÃO: CONECTANDO AS ROTAS DO PAINEL ADMIN ---
// O legacyRoutes agora exporta diretamente o Router, basta fazer o require normal.
const legacyRoutes = require('./legacy.routes');

// Anexa as rotas na raiz do servidor
router.use('/', legacyRoutes); 

// Rota de compatibilidade
router.use('/minhas-apostas', (req, res) => res.redirect(307, '/apostas/minhas'));

module.exports = router;