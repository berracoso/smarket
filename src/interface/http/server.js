const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const errorHandler = require('./middlewares/error-handler');

// Inicializar Express
const app = express();

// --- CORREÇÃO RENDER: Confiar no Proxy ---
app.set('trust proxy', 1);
// -----------------------------------------

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Rotas
app.use(routes);

// Error Handler
app.use(errorHandler);

module.exports = app;