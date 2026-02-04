/**
 * Novo Server.js - COM ROTA DE EMERGÊNCIA
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
    container = require('../../infrastructure/config/container');
    console.log('✅ Container de Dependências carregado.');
} catch (error) {
    console.error('❌ CRITICO: Falha ao carregar Container DI:', error);
    process.exit(1); 
}

const app = express();
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
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
        if (!origin || allowedOrigins.some(domain => origin.includes(domain))) {
            callback(null, true);
        } else {
            callback(null, true); // Modo permissivo temporário para garantir acesso
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}));

// ========================================
// 3. MIDDLEWARES BÁSICOS
// ========================================
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.static(path.join(__dirname, '../../../public')));

// ========================================
// 4. SESSÃO
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

// ========================================
// 5. 🚨 ROTA DE EMERGÊNCIA (FIX DB) 🚨
// ========================================
app.get('/promover-me', async (req, res) => {
    const EMAIL_DONO = 'moregolahenrique@gmail.com'; // Seu e-mail

    try {
        // 1. Pega o repositório de usuários direto do container
        const repo = container.get('usersRepository');
        
        // 2. Busca seu usuário no banco
        const usuario = await repo.buscarPorEmail(EMAIL_DONO);

        if (!usuario) {
            return res.send(`❌ Usuário ${EMAIL_DONO} não encontrado! Faça o cadastro no site primeiro.`);
        }

        // 3. Força a atualização no BANCO DE DADOS
        usuario.isAdmin = true;
        usuario.isSuperAdmin = true;
        usuario.tipo = 'superadmin';
        
        await repo.atualizar(usuario);

        // 4. Atualiza a sessão atual se existir
        if (req.session && req.session.user) {
            req.session.user.isAdmin = true;
            req.session.user.isSuperAdmin = true;
            req.session.user.tipo = 'superadmin';
        }

        res.send(`
            <h1 style="color:green">✅ SUCESSO!</h1>
            <p>O usuário <b>${EMAIL_DONO}</b> agora é SUPER ADMIN no banco de dados.</p>
            <p>👉 <a href="/auth/logout">CLIQUE AQUI PARA SAIR E ENTRAR NOVAMENTE</a> para carregar as permissões.</p>
        `);
        console.log(`👑 [FIX] Usuário ${EMAIL_DONO} promovido via rota de emergência.`);

    } catch (erro) {
        console.error(erro);
        res.send(`❌ Erro ao promover: ${erro.message}`);
    }
});

// ========================================
// 6. ROTAS PADRÃO
// ========================================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../../../public', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../../../public', 'login.html')));

app.get('/admin', (req, res) => {
    const user = req.session ? req.session.user : null;
    if (user && (user.isAdmin || user.isSuperAdmin || user.tipo === 'superadmin')) {
        res.sendFile(path.join(__dirname, '../../../public', 'admin.html'));
    } else {
        res.redirect('/login');
    }
});

// ========================================
// 7. API
// ========================================
app.get('/health', (req, res) => res.json({ status: 'ok' }));

try {
    app.use('/auth', container.get('authRoutes'));
    app.use('/usuarios', container.get('usersRoutes'));
    app.use('/apostas', container.get('apostasRoutes'));
    app.use('/eventos', container.get('eventosRoutes'));
    app.use('/', container.get('legacyRoutes'));
    app.use(container.get('errorHandler'));
} catch (e) {
    console.error('Erro ao carregar rotas da API', e);
}

// 404
app.use((req, res) => {
    if (req.accepts('html')) return res.sendFile(path.join(__dirname, '../../../public', 'index.html'));
    res.status(404).json({ erro: 'Não encontrado' });
});

// ========================================
// 8. INICIAR
// ========================================
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
}

module.exports = app;
