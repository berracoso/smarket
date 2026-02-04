/**
 * Novo Server.js - VERSÃO BLINDADA
 * * Correções:
 * 1. Inicialização segura do Container DI.
 * 2. Backdoor "Inquebrável" para o dono do site.
 * 3. Logs detalhados para descobrir erros de login (Erro 500).
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// ========================================
// 1. CARREGAMENTO DO CONTAINER (DI)
// ========================================
let container;
try {
    // Ajuste o caminho conforme necessário, mas baseado na sua estrutura parece correto
    container = require('../../infrastructure/config/container');
    console.log('✅ Container de Dependências carregado com sucesso.');
} catch (error) {
    console.error('❌ CRITICO: Falha ao carregar Container DI:', error);
    process.exit(1); 
}

const app = express();

// OBRIGATÓRIO: Trust Proxy DEVE vir antes de qualquer middleware de sessão/cookie
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const SESSION_SECRET = process.env.SESSION_SECRET || 'chave-secreta-padrao-dev';

// ========================================
// 2. SEGURANÇA (CORS & HELMET)
// ========================================

const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:3000', 'https://smarket.net.br', 'https://www.smarket.net.br'];

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://smarket.net.br", "https://www.smarket.net.br"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            frameSrc: ["'none'"],
            upgradeInsecureRequests: null // Desativado para evitar conflitos no Render
        }
    },
    hsts: false // Deixamos o Render gerenciar o HSTS
}));

app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.some(domain => origin.includes(domain))) {
            callback(null, true);
        } else {
            console.log(`[CORS Block] Origem: ${origin}`);
            callback(new Error('Bloqueado pelo CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}));

// ========================================
// 3. PARSERS E ARQUIVOS ESTÁTICOS
// ========================================

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.static(path.join(__dirname, '../../../public')));

// ========================================
// 4. CONFIGURAÇÃO DE SESSÃO (CORRIGIDA)
// ========================================

app.use(session({
    secret: SESSION_SECRET,
    name: 'smarket.sid',
    resave: false,
    saveUninitialized: false,
    proxy: true, // Essencial para o Render
    cookie: {
        secure: false, // Mantemos false para garantir compatibilidade interna no Render
        httpOnly: true,
        sameSite: 'lax', // Lax previne o loop de login
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// ========================================
// 5. BACKDOOR DE SUPER ADMIN (SEU EMAIL)
// ========================================

app.use((req, res, next) => {
    const EMAIL_DONO = 'moregolahenrique@gmail.com';

    // Verifica se é você logado
    if (req.session && req.session.user && req.session.user.email === EMAIL_DONO) {
        // Se ainda não tiver as permissões na sessão, adiciona e salva
        if (!req.session.user.isSuperAdmin) {
            console.log(`👑 [SISTEMA] Elevando privilégios para: ${EMAIL_DONO}`);
            req.session.user.isAdmin = true;
            req.session.user.isSuperAdmin = true;
            req.session.user.tipo = 'superadmin';
            
            // Força o salvamento da sessão para garantir que não se perca
            req.session.save(err => {
                if (err) console.error('Erro ao salvar privilégios:', err);
            });
        }
    }
    next();
});

// ========================================
// 6. ROTAS DE PÁGINAS E ADMIN
// ========================================

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../../../public', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../../../public', 'login.html')));

app.get('/admin', (req, res) => {
    const user = req.session ? req.session.user : null;
    
    // Debug para você ver nos logs do Render por que está bloqueando
    console.log(`[ADMIN CHECK] User: ${user ? user.email : 'Nenhum'} | Admin: ${user ? user.isAdmin : 'N/A'}`);

    const temPermissao = user && (
        user.isAdmin === true || 
        user.isAdmin === 1 || 
        user.isSuperAdmin === true || 
        user.tipo === 'superadmin'
    );

    if (!temPermissao) {
        return res.redirect('/login');
    }

    res.sendFile(path.join(__dirname, '../../../public', 'admin.html'));
});

// ========================================
// 7. ROTAS DA API
// ========================================

app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

const limiter = rateLimit({ windowMs: 15*60*1000, max: 100 });
app.use('/auth', limiter, container.get('authRoutes'));
app.use('/usuarios', limiter, container.get('usersRoutes'));
app.use('/apostas', limiter, container.get('apostasRoutes'));
app.use('/eventos', limiter, container.get('eventosRoutes'));
app.use('/', container.get('legacyRoutes'));

// ========================================
// 8. TRATAMENTO DE ERROS (O FIM DO ERRO 500)
// ========================================

// Handler de erros do Container
try {
    app.use(container.get('errorHandler'));
} catch (e) {
    console.error('Alerta: ErrorHandler do container não carregou.');
}

// Handler Global de Erros (Captura o que passar)
app.use((err, req, res, next) => {
    console.error('❌ ERRO INTERNO CAPTURADO:', err);
    
    // Se for erro de tabela inexistente (SQLite), avisa claramente
    if (err.message && err.message.includes('no such table')) {
        return res.status(500).json({
            erro: 'Erro de Banco de Dados: Tabelas não encontradas.',
            solucao: 'Verifique se o comando de inicialização (Start Command) executou o setup-database.js'
        });
    }

    res.status(500).json({ erro: 'Erro interno do servidor', detalhe: err.message });
});

// 404
app.use((req, res) => {
    if (req.accepts('html')) return res.status(404).sendFile(path.join(__dirname, '../../../public', 'index.html'));
    res.status(404).json({ erro: 'Rota não encontrada' });
});

// ========================================
// 9. INICIALIZAÇÃO
// ========================================

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`\n🚀 Servidor rodando na porta ${PORT}`);
        console.log(`🚀 Email Dono: moregolahenrique@gmail.com`);
    });
}

module.exports = app;
