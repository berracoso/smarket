const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const routes = require('./routes');
const errorHandler = require('./middlewares/error-handler');

const app = express();

// Configuração para o Render (Trust Proxy)
app.set('trust proxy', 1);

// Segurança e JSON
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// --- CORREÇÃO DE CAMINHO ---
// Usamos process.cwd() para garantir que ele comece da RAIZ do projeto no Render
const publicPath = path.join(process.cwd(), 'public');
app.use(express.static(publicPath));
// ---------------------------

// Rate Limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Rotas da API
app.use(routes);

// Rota para carregar o index.html (Frontend)
app.get('*', (req, res, next) => {
  // Se for uma rota de API que não existe, deixa passar para o erro 404/500
  if (req.url.startsWith('/auth') || req.url.startsWith('/apostas') || req.url.startsWith('/eventos')) {
    return next();
  }
  // Envia o index.html usando o caminho absoluto corrigido
  res.sendFile(path.join(publicPath, 'index.html'), (err) => {
    if (err) {
      next(err);
    }
  });
});

app.use(errorHandler);

module.exports = app;