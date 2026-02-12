const { Router } = require('express');

// Importa os arquivos de rota
const authRoutes = require('./auth.routes');
const apostasRoutes = require('./apostas.routes');
const eventosRoutes = require('./eventos.routes');
const legacyRoutes = require('./legacy.routes'); // 1. Importação das rotas de compatibilidade

// Importa Controllers e Casos de Uso do Container para configurar as rotas legadas
const ApostasController = require('../controllers/ApostasController');
const EventosController = require('../controllers/EventosController');

// Busca as dependências no Container de Injeção de Dependência
const {
    criarAposta,
    listarMinhasApostas,
    obterHistoricoApostas,
    calcularRetornoEstimado,
    obterEventoAtivo,
    criarNovoEvento,
    abrirFecharApostas,
    definirVencedor,
    resetarEvento,
    authenticationMiddleware
} = require('../../../infrastructure/config/container');

const router = Router();

// --- Instancia os Controllers necessários para as rotas antigas ---
// Isso recria os controllers para passar para o arquivo legacy.routes.js
const apostasController = new ApostasController(
    criarAposta,
    listarMinhasApostas,
    obterHistoricoApostas,
    calcularRetornoEstimado
);

const eventosController = new EventosController(
    obterEventoAtivo,
    criarNovoEvento,
    abrirFecharApostas,
    definirVencedor,
    resetarEvento
);

// --- Monta as Rotas ---

// 1. Rotas Novas (Padrão Clean Architecture)
router.use('/auth', authRoutes);
router.use('/apostas', apostasRoutes);
router.use('/eventos', eventosRoutes);

// 2. Rotas Legadas (Compatibilidade com Frontend antigo)
// Essas rotas atendem as chamadas que estavam dando erro 404/loop:
// /resumo, /minhas-apostas, /historico-apostas, /dados, etc.
router.use('/', legacyRoutes(apostasController, eventosController, authenticationMiddleware));

// 3. Rota de saúde (Health Check)
router.get('/health', (req, res) => res.json({ status: 'OK' }));

module.exports = router;