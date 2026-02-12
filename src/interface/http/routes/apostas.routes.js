const { Router } = require('express');
const ApostasController = require('../controllers/ApostasController');

// Importando dependências do container
const {
    criarAposta,
    listarMinhasApostas,
    obterHistoricoApostas,
    calcularRetornoEstimado,
    authenticationMiddleware,
    authorizationMiddleware
} = require('../../../infrastructure/config/container');

const router = Router();

// Instanciando o controller com todos os casos de uso necessários
const apostasController = new ApostasController(
    criarAposta,
    listarMinhasApostas,
    obterHistoricoApostas,
    calcularRetornoEstimado
);

// Todas as rotas requerem autenticação
router.use(authenticationMiddleware.requireAuth());

// POST /apostas - Criar nova aposta
router.post('/', authorizationMiddleware.canBet(), (req, res, next) => {
    apostasController.criar(req, res, next);
});

// GET /apostas/minhas - Listar minhas apostas
router.get('/minhas', (req, res, next) => {
    apostasController.minhas(req, res, next);
});

// GET /apostas/historico - Histórico geral
router.get('/historico', (req, res, next) => {
    apostasController.historico(req, res, next);
});

// POST /apostas/simular - Simular retorno
router.post('/simular', (req, res, next) => {
    apostasController.simular(req, res, next);
});

module.exports = router;