require('dotenv').config();
const app = require('./src/interface/http/server');

// O Render define a porta automaticamente na variável PORT
const PORT = process.env.PORT || 3000;

// O servidor precisa escutar em 0.0.0.0 para funcionar no Render
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const errorHandler = require('./middlewares/error-handler');

// Inicializar Express
const app = express();

// --- CORREÇÃO RENDER: Confiar no Proxy ---
// Necessário para evitar o erro "ValidationError: The 'X-Forwarded-For' header is set..."
app.set('trust proxy', 1);
// -----------------------------------------

// Middlewares de Segurança e Utilidade
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de requisições por IP
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Rotas da API
app.use(routes);

// Middleware de tratamento de erros
app.use(errorHandler);

module.exports = app;