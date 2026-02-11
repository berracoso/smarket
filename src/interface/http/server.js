const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const routes = require('./routes');
const errorHandler = require('./middlewares/error-handler');

const app = express();

// Configuração para o Render
app.set('trust proxy', 1);

// Segurança e JSON
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// Servir os arquivos do site (HTML/CSS/JS)
app.use(express.static(path.join(__dirname, '../../../../public')));

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

// Rota para carregar o index.html se não encontrar a rota na API
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/auth') || req.url.startsWith('/apostas') || req.url.startsWith('/eventos')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../../../../public/index.html'));
});

app.use(errorHandler);

module.exports = app;