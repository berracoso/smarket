/**
 * Novo Server.js - CORREÇÃO DE LOOP DE LOGIN
 * Adiciona regra para forçar permissões do Super Admin e impedir o loop.
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
app.set('trust proxy', 1); // Obrigatório para o Render

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
        // Permissivo para evitar bloqueios durante o conserto
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
        secure: false, // Importante: mantemos false para garantir que o cookie passe
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
// Este bloco roda em TODA requisição e conserta seu usuário automaticamente
app.use(async (req, res, next) => {
    // Lista de e-mails que são sempre Donos/Admin
    const EMAILS_SUPREMOS = ['admin@bolao.com', 'moregolahenrique@gmail.com'];

    if (req.session && req.session.user && EMAILS_SUPREMOS.includes(req.session.user.email)) {
        
        // Se a sessão diz que NÃO é admin, vamos corrigir isso agora
        if (!req.session.user.isAdmin || !req.session.user.isSuperAdmin) {
            console.log(`👑 [AUTO-FIX] Detectado Dono (${req.session.user.email}) sem permissão. Corrigindo...`);
            
            // 1. Corrige a Sessão (Memória) - Isso para o Loop imediatamente
            req.session.user.isAdmin = true;
            req.session.user.isSuperAdmin = true;
            req.session.user.tipo = 'superadmin';

            // 2. Tenta corrigir o Banco de Dados (Persistência)
            try {
                const repo = container.get('usersRepository');
                const usuarioDB = await repo.buscarPorEmail(req.session.user.email);
                if (usuarioDB) {
                    usuarioDB.isAdmin = true;
                    usuarioDB.isSuperAdmin = true;
                    usuarioDB.tipo = 'superadmin';
                    await repo.atualizar(usuarioDB);
                    console.log(`💾 [AUTO-FIX] Usuário atualizado no Banco de Dados com sucesso.`);
                }
            } catch (err) {
                console.error('Erro ao atualizar DB no auto-fix (não crítico, sessão já foi corrigida):', err.message);
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
    const user = req.session ? req.session.user : null;
    
    // Verificação simplificada
    if (user && (user.isAdmin || user.isSuperAdmin)) {
        res.sendFile(path.join(__dirname, '../../../public', 'admin.html'));
    } else {
        console.log(`⛔ Bloqueio Admin: Usuário ${user ? user.email : 'anônimo'} tentou entrar.`);
        res.redirect('/login');
    }
});

// ========================================
// 6. API E ROTAS FINAIS
// ========================================
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// Rota manual de emergência (caso precise forçar via link)
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

// 404
app.use((req, res) => {
    if (req.accepts('html')) return res.status(404).sendFile(path.join(__dirname, '../../../public', 'index.html'));
    res.status(404).json({ erro: 'Rota não encontrada' });
});

// Inicialização
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor rodando na porta ${PORT}`);
        console.log(`🛡️  Modo Auto-Fix de Admin ATIVADO para: admin@bolao.com`);
    });
}

module.exports = app;
