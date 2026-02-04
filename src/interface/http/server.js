/**
 * Novo Server.js - CORRIGIDO
 * Ajustado para ler req.session.usuario (conforme SessionManager)
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// ========================================
// 1. CARREGAMENTO DO CONTAINER
// ========================================
let container;
try {
    container = require('../../infrastructure/config/container');
} catch (error) {
    console.error('CRITICO: Falha ao carregar Container DI:', error);
    process.exit(1); 
}

const app = express();
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'chave-secreta-padrao';

// ========================================
// 2. SEGURANÇA
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
            upgradeInsecureRequests: null
        }
    },
    hsts: false
}));

app.use(cors({
    origin: function(origin, callback) {
        callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}));

// ========================================
// 3. CONFIGURAÇÃO DE SESSÃO
// ========================================
app.use(session({
    secret: SESSION_SECRET,
    name: 'smarket.sid',
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
        secure: false,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.static(path.join(__dirname, '../../../public')));

// ========================================
// 4. 👑 REGRA DE OURO (CORREÇÃO DO LOOP) 👑
// ========================================
app.use(async (req, res, next) => {
    // Lista de e-mails que são sempre Donos/Admin
    const EMAILS_SUPREMOS = ['admin@bolao.com', 'moregolahenrique@gmail.com'];

    // CORREÇÃO AQUI: Mudado de req.session.user para req.session.usuario
    if (req.session && req.session.usuario && EMAILS_SUPREMOS.includes(req.session.usuario.email)) {
        
        // CORREÇÃO AQUI: Mudado de req.session.user para req.session.usuario
        if (!req.session.usuario.isAdmin || !req.session.usuario.isSuperAdmin) {
            console.log(`👑 [AUTO-FIX] Detectado Dono (${req.session.usuario.email}) sem permissão. Corrigindo...`);
            
            // 1. Corrige a Sessão (Memória)
            req.session.usuario.isAdmin = true;
            req.session.usuario.isSuperAdmin = true;
            req.session.usuario.tipo = 'superadmin';

            // 2. Tenta corrigir o Banco de Dados (Persistência)
            try {
                const repo = container.get('usersRepository');
                const usuarioDB = await repo.buscarPorEmail(req.session.usuario.email);
                if (usuarioDB) {
                    usuarioDB.isAdmin = true;
                    usuarioDB.isSuperAdmin = true;
                    usuarioDB.tipo = 'superadmin';
                    await repo.atualizar(usuarioDB);
                    console.log(`💾 [AUTO-FIX] Usuário atualizado no Banco de Dados com sucesso.`);
                }
            } catch (err) {
                console.error('Erro ao atualizar DB no auto-fix:', err.message);
            }
        }
    }
    next();
});

// ========================================
// 5. ROTAS DE PÁGINAS
// ========================================

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../../../public', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../../../public', 'login.html')));

app.get('/admin', (req, res) => {
    // CORREÇÃO AQUI: Mudado de req.session.user para req.session.usuario
    const usuario = req.session ? req.session.usuario : null;
    
    if (usuario && (usuario.isAdmin || usuario.isSuperAdmin)) {
        res.sendFile(path.join(__dirname, '../../../public', 'admin.html'));
    } else {
        console.log(`⛔ Bloqueio Admin: Tentativa de acesso negada.`);
        res.redirect('/login');
    }
});

// ========================================
// 6. API E ROTAS FINAIS
// ========================================
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

app.get('/fix-admin', (req, res) => {
    res.send('<h1>Auto-fix ativo</h1><p>Se você está vendo isso e está logado como admin@bolao.com, suas permissões já foram corrigidas. <a href="/admin">Ir para Admin</a></p>');
});

try {
    app.use('/auth', container.get('authRoutes'));
    app.use('/usuarios', container.get('usersRoutes'));
    app.use('/apostas', container.get('apostasRoutes'));
    app.use('/eventos', container.get('eventosRoutes'));
    app.use('/', container.get('legacyRoutes'));
    app.use(container.get('errorHandler'));
} catch (e) {
    console.error('Erro carregando rotas:', e);
}

app.use((req, res) => {
    if (req.accepts('html')) return res.status(404).sendFile(path.join(__dirname, '../../../public', 'index.html'));
    res.status(404).json({ erro: 'Rota não encontrada' });
});

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor rodando na porta ${PORT}`);
        console.log(`🛡️  Modo Auto-Fix de Admin ATIVADO para: admin@bolao.com`);
    });
}

module.exports = app;
