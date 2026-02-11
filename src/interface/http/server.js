const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path'); // Necessário para caminhos de arquivos
const routes = require('./routes');
const errorHandler = require('./middlewares/error-handler');

// Inicializar Express
const app = express();

// --- CORREÇÃO RENDER: Confiar no Proxy ---
app.set('trust proxy', 1);

// Middlewares de Segurança e Utilidade
// Ajustamos o helmet para permitir scripts do próprio site (evita bloqueio do navegador)
app.use(
  helmet({
    contentSecurityPolicy: false, 
  })
);
app.use(cors());
app.use(express.json());

// --- SERVIR ARQUIVOS ESTÁTICOS (FRONTEND) ---
// Isso faz o site (HTML/CSS/JS) funcionar!
// O caminho sobe 3 níveis (src -> interface -> http) para chegar na raiz e entrar em public
app.use(express.static(path.join(__dirname, '../../../../public'))); 
// ---------------------------------------------

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Rotas da API
app.use(routes);

// --- ROTA DE FALLBACK (Garante que o site abra) ---
// Se não for uma rota de API e não achou arquivo estático, manda o index.html
app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api') || req.url.startsWith('/auth')) {
        return next(); // Deixa o error handler lidar com APIs quebradas
    }
    res.sendFile(path.join(__dirname, '../../../../public/index.html'));
});

// Middleware de tratamento de erros
app.use(errorHandler);

module.exports = app;