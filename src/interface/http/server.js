require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session'); 
const SQLiteStore = require('connect-sqlite3')(session); 
const path = require('path');
const routes = require('./routes');
const errorHandler = require('./middlewares/error-handler');

const app = express();

app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// --- CORREÇÃO: Banco de sessões separado para evitar "Database is Locked" ---
app.use(session({
  store: new SQLiteStore({
    db: 'sessions.db', // <-- Usa um banco exclusivo para logins
    dir: path.join(process.cwd()) 
  }),
  secret: process.env.SESSION_SECRET || 'segredo_super_secreto_smarket_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', 
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000 
  }
}));

const publicPath = path.join(process.cwd(), 'public');
app.use(express.static(publicPath));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(routes); // Aqui ele carrega o nosso index.js corrigido

app.get('/login', (req, res) => {
    res.sendFile(path.join(publicPath, 'login.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(publicPath, 'admin.html'));
});

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

// --- CORREÇÃO: OBRIGATÓRIO PARA O RENDER RECONHECER A APLICAÇÃO ---
// Garante que o servidor abre a porta e escuta requisições
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
  });
}

module.exports = app;