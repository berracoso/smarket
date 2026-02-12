const { Router } = require('express');

// Importa os arquivos de rota
const authRoutes = require('./auth.routes');
const apostasRoutes = require('./apostas.routes');
const eventosRoutes = require('./eventos.routes');
const legacyRoutes = require('./legacy.routes'); // IMPORTANTE: Rotas de compatibilidade

// Importa Controllers e Casos de Uso do Container para as rotas legadas
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

// 1. Rotas Novas (Padrão Clean Arch)
router.use('/auth', authRoutes);
router.use('/apostas', apostasRoutes);
router.use('/eventos', eventosRoutes);

// 2. Rotas Legadas (Compatibilidade com Frontend antigo)
// Resolve o erro "Erro ao carregar dados"
router.use('/', legacyRoutes(apostasController, eventosController, authenticationMiddleware));

// 3. Rota de saúde (Health Check)
router.get('/health', (req, res) => res.json({ status: 'OK' }));

module.exports = router;