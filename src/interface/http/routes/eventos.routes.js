const { Router } = require('express');
const EventosController = require('../controllers/EventosController');

// Importando dependências do container
const {
    obterEventoAtivo,
    criarNovoEvento,
    abrirFecharApostas,
    definirVencedor,
    resetarEvento,
    authenticationMiddleware,
    authorizationMiddleware
} = require('../../../infrastructure/config/container');

const router = Router();

// Instanciando controller
const eventosController = new EventosController(
    obterEventoAtivo,
    criarNovoEvento,
    abrirFecharApostas,
    definirVencedor,
    resetarEvento
);

// Rotas Públicas (ou com auth opcional)
router.get('/ativo', authenticationMiddleware.optionalAuth(), (req, res, next) => {
    eventosController.ativo(req, res, next);
});

// GET /eventos - Listar eventos (Wrapper manual para manter compatibilidade)
router.get('/', authenticationMiddleware.optionalAuth(), async (req, res, next) => {
    try {
        const resultado = await obterEventoAtivo.executar();
        if (resultado.evento) {
            res.json({ eventos: [resultado.evento] });
        } else {
            res.json({ eventos: [] });
        }
    } catch (erro) {
        next(erro);
    }
});

// --- Área Administrativa ---
// Rotas abaixo requerem Autenticação E Permissão de Admin
router.use(authenticationMiddleware.requireAuth());
router.use(authorizationMiddleware.requireAdmin());

router.post('/', (req, res, next) => eventosController.criar(req, res, next));
router.patch('/ativo/apostas', (req, res, next) => eventosController.toggleApostas(req, res, next));
router.post('/ativo/vencedor', (req, res, next) => eventosController.definirVencedor(req, res, next));
router.post('/resetar', (req, res, next) => eventosController.resetar(req, res, next));

module.exports = router;