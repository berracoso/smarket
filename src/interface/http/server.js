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
// Define a pasta public como estática
const publicPath = path.join(process.cwd(), 'public');
app.use(express.static(publicPath));

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

// --- ROTAS DO FRONTEND (CORREÇÃO DO LOOP) ---

// 1. Rota de Login (Entrega o login.html diretamente)
app.get('/login', (req, res) => {
    res.sendFile(path.join(publicPath, 'login.html'));
});

// 2. Rota de Admin (Entrega o admin.html diretamente)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(publicPath, 'admin.html'));
});

// 3. Catch-all (SPA)
// Qualquer outra rota que não seja API vai para o index.html
app.get('*', (req, res, next) => {
  // Se for uma rota de API que não existe, deixa passar para o erro 404 JSON
  if (req.url.startsWith('/auth') || req.url.startsWith('/apostas') || req.url.startsWith('/eventos')) {
    return next();
  }
  
  // Senão, entrega o painel principal
  res.sendFile(path.join(publicPath, 'index.html'), (err) => {
    if (err) {
      next(err);
    }
  });
});

app.use(errorHandler);

module.exports = app;