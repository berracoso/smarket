/**
 * Novo Server.js - Clean Architecture
 * 
 * Servidor Express configurado com Dependency Injection Container.
 * Todas as dependências são gerenciadas pelo Container DI.
 * 
 * Responsabilidades:
 * - Configurar Express e middlewares globais
 * - Configurar express-session
 * - Servir arquivos estáticos
 * - Registrar rotas da API (via Container)
 * - Registrar Error Handler
 * - Iniciar servidor HTTP
 */

// Carregar variáveis de ambiente
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Importar o Container DI
const container = require('../../infrastructure/config/container');

// Criar aplicação Express
const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-key-change-in-production';

// Domínios permitidos para CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3000'];

// ========================================
// MIDDLEWARES GLOBAIS DE SEGURANÇA
// ========================================

// Helmet - Adiciona headers de segurança HTTP
// Configurado com Content Security Policy (CSP) para prevenção de XSS
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline necessário para estilos dinâmicos
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameSrc: ["'none'"],
            upgradeInsecureRequests: NODE_ENV === 'production' ? [] : null
        }
    },
    // HSTS - Força HTTPS em produção
    hsts: NODE_ENV === 'production' ? {
        maxAge: 31536000, // 1 ano
        includeSubDomains: true,
        preload: true
    } : false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false
}));

// Middleware para redirect HTTP → HTTPS em produção
if (NODE_ENV === 'production') {
    app.use((req, res, next) => {
        // Verifica header x-forwarded-proto (comum em proxies/load balancers)
        if (req.headers['x-forwarded-proto'] !== 'https' && req.hostname !== 'localhost') {
            return res.redirect(301, `https://${req.hostname}${req.url}`);
        }
        next();
    });
}

// CORS - Restringir apenas a domínios permitidos
app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Origem não permitida pelo CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type']
}));

// Rate Limiting - Proteção contra força bruta
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 tentativas
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    standardHeaders: true,
    legacyHeaders: false
});

const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 100, // 100 requisições por minuto
    standardHeaders: true,
    legacyHeaders: false
});

// Body Parser - JSON
app.use(express.json({ limit: '1mb' }));

// Body Parser - URL Encoded
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Servir arquivos estáticos (public/)
app.use(express.static(path.join(__dirname, '../../../public')));

// ========================================
// CONFIGURAÇÃO DE SESSÃO
// ========================================

app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: NODE_ENV === 'production', // HTTPS em produção
        httpOnly: true,
        sameSite: 'strict',
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
    res.sendFile(path.join(__dirname, '../../../public', 'admin.html'));
});

// ========================================
// ROTAS DA API (via Container DI)
// ========================================

// Rotas de Autenticação (com rate limiting)
app.use('/auth/login', loginLimiter);
app.use('/auth/registro', loginLimiter);
app.use('/auth', container.get('authRoutes'));

// Rotas de Usuários (com rate limiting)
app.use('/usuarios', apiLimiter, container.get('usersRoutes'));

// Rotas de Apostas (com rate limiting)
app.use('/apostas', apiLimiter, container.get('apostasRoutes'));

// Rotas de Eventos (com rate limiting)
app.use('/eventos', apiLimiter, container.get('eventosRoutes'));

// Rotas de Compatibilidade (Legacy - Frontend antigo)
app.use('/', container.get('legacyRoutes'));

// ========================================
// ROTAS LEGADAS (Compatibilidade)
// ========================================
// Estas rotas mantêm compatibilidade com o frontend existente

// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        container: {
            dependencies: container.list().length,
            ready: true
        }
    });
});

// ========================================
// ERROR HANDLER (deve ser o último middleware)
// ========================================

app.use(container.get('errorHandler'));

// ========================================
// 404 - Rota não encontrada
// ========================================

app.use((req, res) => {
    res.status(404).json({
        sucesso: false,
        erro: 'Rota não encontrada',
        path: req.path
    });
});

// ========================================
// INICIALIZAR SERVIDOR
// ========================================

function iniciarServidor() {
    const server = app.listen(PORT, () => {
        console.log('\n🚀 ========================================');
        console.log('🚀 Servidor Bolão Privado - Clean Architecture');
        console.log('🚀 ========================================');
        console.log(`🚀 Porta: ${PORT}`);
        console.log(`🚀 Ambiente: ${NODE_ENV}`);
        console.log(`🚀 Session Secret: ${SESSION_SECRET !== 'dev-secret-key-change-in-production' ? '✅ Configurado' : '⚠️  USANDO VALOR PADRÃO'}`);
        console.log(`🚀 CORS permitido para: ${allowedOrigins.join(', ')}`);
        console.log(`🚀 Container DI: ${container.list().length} dependências`);
        console.log('🚀 ========================================');
        console.log(`🚀 URLs disponíveis:`);
        console.log(`🚀   - http://localhost:${PORT}/`);
        console.log(`🚀   - http://localhost:${PORT}/login`);
        console.log(`🚀   - http://localhost:${PORT}/admin`);
        console.log(`🚀   - http://localhost:${PORT}/health`);
        console.log('🚀 ========================================\n');
    });

    return server;
}

// ========================================
// TRATAMENTO DE ERROS GLOBAIS
// ========================================

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection:', reason);
    process.exit(1);
});

// ========================================
// GRACEFUL SHUTDOWN
// ========================================

let server;

process.on('SIGTERM', () => {
    console.log('👋 SIGTERM recebido, encerrando servidor...');
    if (server) {
        server.close(() => {
            console.log('✅ Servidor encerrado');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});

process.on('SIGINT', () => {
    console.log('👋 SIGINT recebido, encerrando servidor...');
    if (server) {
        server.close(() => {
            console.log('✅ Servidor encerrado');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});

// ========================================
// EXPORTAR APP E INICIAR
// ========================================

// Iniciar servidor automaticamente quando módulo é carregado
// (exceto durante testes)
if (process.env.NODE_ENV !== 'test') {
    server = iniciarServidor();
}

// Exportar para testes
module.exports = app;
