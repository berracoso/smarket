const { Router } = require('express');

const authRoutes = require('./auth.routes');
const apostasRoutes = require('./apostas.routes');
const eventosRoutes = require('./eventos.routes');

const router = Router();

// Monta as rotas
router.use('/auth', authRoutes);
router.use('/apostas', apostasRoutes);
router.use('/eventos', eventosRoutes);

// Rota de saúde para o Render verificar se o app está vivo
router.get('/health', (req, res) => res.json({ status: 'OK' }));

module.exports = router;