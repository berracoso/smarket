const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const errorHandler = require('./middlewares/error-handler');

// Inicializar Express
const app = express();

// --- CORREÇÃO RENDER: Confiar no Proxy ---
// Necessário porque o Render coloca a aplicação atrás de um Load Balancer.
// Isso resolve o erro: "ValidationError: The 'X-Forwarded-For' header is set..."
app.set('trust proxy', 1);
// -----------------------------------------

// Middlewares de Segurança e Utilidade
app.use(helmet());
app.use(cors()); // Configure as origens permitidas em produção se necessário
app.use(express.json());

// Rate Limiting (Proteção contra força bruta)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
  standardHeaders: true,
  legacyHeaders: false,
  // A validação do trust proxy agora vai passar porque definimos app.set('trust proxy', 1)
});

// Aplicar rate limit globalmente (ou apenas em rotas sensíveis se preferir)
app.use(limiter);

// Rotas da API
app.use(routes);

// Middleware de tratamento de erros (deve ser o último)
app.use(errorHandler);

module.exports = app;