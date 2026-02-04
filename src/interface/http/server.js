/**
 * Novo Server.js - CORRIGIDO E DEFINITIVO
 * * Correções aplicadas:
 * 1. Removido redirecionamento manual HTTPS (evita loop infinito no Render).
 * 2. Sessão configurada para aceitar proxy reverso (Render).
 * 3. CORS ajustado para aceitar subdomínios e localhost.
 * 4. Proteção contra falhas no Container de Dependências.
 */

// Carregar variáveis de ambiente
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Importar o Container DI (com tratamento de erro caso falhe)
let container;
try {
    container = require('../../infrastructure/config/container');
} catch (error) {
    console.error('CRITICO: Falha ao carregar o Container DI:', error);
    process.exit(1); // Encerra se não tiver container
}

// Criar aplicação Express
const app = express();

// --- CORREÇÃO 1: Trust Proxy deve ser a primeira configuração ---
// Diz ao Express para confiar no Render (que termina o SSL)
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const SESSION_SECRET = process.env.SESSION_SECRET || 'chave-secreta-padrao-dev';

// Domínios permitidos para CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'https://smarket.net.br', 'https://www.smarket.net.br'];

// ========================================
// MIDDLEWARES GLOBAIS DE SEGURANÇA
// ========================================

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"], // Adicionado CDN comum
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://smarket.net.br", "https://www.smarket.net.br"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            frameSrc: ["'none'"],
            upgradeInsecureRequests: null // Desativado para evitar conflito com Render
        }
    },
    hsts: false, // Desativado HSTS manual, deixa o Render gerenciar
    crossOriginEmbedderPolicy: false
}));

// --- CORREÇÃO 2: Removido o bloco de redirecionamento HTTP->HTTPS manual ---
// O Render já faz isso se a opção "Redirect HTTP to HTTPS" estiver ativada no painel.
// Ter isso no código causava o loop infinito.

// CORS - Configuração Robusta
app.use(cors({
    origin: function(origin, callback) {
        // Permite requisições sem origem (como apps mobile ou curl) e origens permitidas
        if (!origin || allowedOrigins.some(domain => origin.includes(domain))) {
            callback(null, true);
        } else {
            console.log(`[CORS] Bloqueado: ${origin}`);
            callback(new Error('Origem não permitida pelo CORS'));
        }
    },
    credentials: true, // Essencial para cookies de sessão funcionarem
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // Aumentei um pouco para evitar bloqueio nos seus testes
    message: 'Muitas tentativas. Tente novamente em 15 minutos.',
    standardHeaders: true,
    legacyHeaders: false
});

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../../../public')));

// ========================================
// CONFIGURAÇÃO DE SESSÃO (CRÍTICO)
// ========================================

app.use(session({
    secret: SESSION_SECRET,
    name: 'sessionId', // Nome personalizado ajuda a evitar conflitos
    resave: false,
    saveUninitialized: false,
    proxy: true, // OBRIGATÓRIO NO RENDER
    cookie: {
        // secure: false é crucial aqui pois o Node roda em HTTP dentro do Render
        secure: false, 
        httpOnly: true,
        sameSite: 'lax', // Lax permite navegação entre páginas mantendo o login
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// ========================================
// ROTAS HTML (Páginas)
// ========================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../public', 'login.html'));
});

app.get('/admin', (req, res) => {
    const usuario = req.session ? req.session.user : null;

    console.log('[ADMIN] Tentativa de acesso:', usuario ? usuario.email : 'Visitante não logado');
    
    // Verificação que aceita qualquer variação de admin
    const ehAdmin = usuario && (
        usuario.isAdmin === true || 
        usuario.isAdmin === 1 || 
        usuario.isAdmin === '1' ||
        usuario.isSuperAdmin === true || 
        usuario.isSuperAdmin === 1 ||
        usuario.tipo === 'superadmin' ||
        usuario.tipo === 'admin'
    );

    if (!ehAdmin) {
        console.log('[ADMIN] ⛔ Acesso negado -> Redirecionando para Login');
        // Importante: garante que a sessão seja salva antes de redirecionar
        if (req.session) req.session.save(() => res.redirect('/login'));
        else res.redirect('/login');
        return;
    }

    console.log('[ADMIN] ✅ Acesso Permitido');
    res.sendFile(path.join(__dirname, '../../../public', 'admin.html'));
});

// ========================================
// ROTAS DA API
// ========================================

// Health Check (Antes das outras rotas para sempre funcionar)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// Rotas injetadas pelo container
app.use('/auth/login', loginLimiter);
app.use('/auth/registro', loginLimiter);
app.use('/auth', container.get('authRoutes'));
app.use('/usuarios', apiLimiter, container.get('usersRoutes'));
app.use('/apostas', apiLimiter, container.get('apostasRoutes'));
app.use('/eventos', apiLimiter, container.get('eventosRoutes'));
app.use('/', container.get('legacyRoutes'));

// ========================================
// ERROR HANDLER & 404
// ========================================

// Tratamento de Erros da Aplicação
try {
    app.use(container.get('errorHandler'));
} catch (e) {
    // Fallback caso o error handler do container falhe
    app.use((err, req, res, next) => {
        console.error('Erro não tratado:', err);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    });
}

// 404 - Rota não encontrada
app.use((req, res) => {
    // Se aceitar HTML (navegador), manda pro index ou 404 page
    if (req.accepts('html')) {
        res.status(404).sendFile(path.join(__dirname, '../../../public', 'index.html')); // Fallback para SPA ou home
        return;
    }
    // Se for API
    res.status(404).json({ sucesso: false, erro: 'Rota não encontrada' });
});

// ========================================
// INICIALIZAR
// ========================================

function iniciarServidor() {
    const server = app.listen(PORT, () => {
        console.log(`\n🚀 Servidor rodando na porta ${PORT}`);
        console.log(`🚀 Ambiente: ${NODE_ENV}`);
        console.log(`🚀 Proxy Trust: Ativado`);
        console.log(`🚀 Cookie Secure: FALSE (Modo Compatibilidade Render)`);
    });
    return server;
}

// Tratamento de exceções globais para não derrubar o servidor silenciosamente
process.on('uncaughtException', (err) => {
    console.error('❌ CRASH (Uncaught Exception):', err);
});

process.on('unhandledRejection', (reason) => {
    console.error('❌ CRASH (Unhandled Rejection):', reason);
});

if (process.env.NODE_ENV !== 'test') {
    iniciarServidor();
}

module.exports = app;
