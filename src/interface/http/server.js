require('dotenv').config(); // Garante que as variáveis de ambiente carreguem
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session'); // Importa sessão
const pgSession = require('connect-pg-simple')(session); // Integra com Postgres
const path = require('path');
const routes = require('./routes');
const errorHandler = require('./middlewares/error-handler');
const database = require('../../infrastructure/database/postgres'); // Importa conexão do banco

const app = express();

// Configuração para o Render (Trust Proxy)
app.set('trust proxy', 1);

// Segurança e JSON
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// --- CORREÇÃO DO LOGIN QUE DESAPARECE ---
app.use(session({
  store: new pgSession({
    pool: database.pool, // Usa a conexão existente
    tableName: 'user_sessions', // Nome da tabela de sessão
    createTableIfMissing: true // Cria a tabela automaticamente se não existir
  }),
  secret: process.env.SESSION_SECRET || 'segredo_super_secreto_smarket_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // True se estiver em produção (HTTPS)
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 dias
  }
}));

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

// --- ROTAS DO FRONTEND ---

// 1. Rota de Login
app.get('/login', (req, res) => {
    res.sendFile(path.join(publicPath, 'login.html'));
});

// 2. Rota de Admin
app.get('/admin', (req, res) => {
    res.sendFile(path.join(publicPath, 'admin.html'));
});

// 3. Catch-all (SPA)
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/auth') || req.url.startsWith('/apostas') || req.url.startsWith('/eventos')) {
    return next();
  }
  
  res.sendFile(path.join(publicPath, 'index.html'), (err) => {
    if (err) {
      next(err);
    }
  });
});

app.use(errorHandler);

module.exports = app;