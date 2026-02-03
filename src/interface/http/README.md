# 🚀 Novo Server.js - Clean Architecture

## 📋 Visão Geral

O **novo server.js** é uma implementação limpa e moderna que utiliza o **Container de Injeção de Dependências** para gerenciar todas as dependências da aplicação.

## 🏗️ Arquitetura

### Entry Point (`server.js`)

```javascript
require('./src/interface/http/server');
```

Arquivo minimalista que apenas carrega o servidor principal.

### Servidor Principal (`src/interface/http/server.js`)

Configuração completa do Express com:
- Middlewares globais (CORS, JSON, Static files)
- Express-session
- Rotas da API (via Container DI)
- Error Handler
- Graceful shutdown

## 📦 Estrutura de Arquivos

```
bolao-privado/
├── server.js                          # Entry point (novo)
├── server-old.js                      # Servidor monolítico (backup)
└── src/
    └── interface/
        └── http/
            ├── server.js              # Servidor Express (novo)
            ├── controllers/           # 3 Controllers
            ├── middlewares/           # 3 Middlewares
            └── routes/                # 4 Routes
```

## 🔄 Migração do Server.js

### Antes (Monolítico - 1084 linhas)

```javascript
// server-old.js
const express = require('express');
const app = express();

// 1084 linhas de código misturando:
// - Configuração
// - Lógica de negócio
// - Acesso ao banco
// - Regras de cálculo
// - Middlewares
// - Rotas
// ...
```

### Depois (Clean Architecture - 12 linhas)

```javascript
// server.js (entry point)
require('./src/interface/http/server');
```

```javascript
// src/interface/http/server.js (180 linhas organizadas)
const container = require('../../infrastructure/config/container');

app.use('/auth', container.get('authRoutes'));
app.use('/apostas', container.get('apostasRoutes'));
app.use('/eventos', container.get('eventosRoutes'));
app.use(container.get('errorHandler'));
```

## ✨ Benefícios

### 1. **Separação de Responsabilidades**
- Server.js → Configuração do Express
- Controllers → Extrair dados e chamar Use Cases
- Use Cases → Orquestrar lógica de negócio
- Repositories → Acesso ao banco de dados

### 2. **Testabilidade**
- Todas as dependências são injetadas
- Fácil mockar para testes unitários
- 231 testes passando após migração

### 3. **Manutenibilidade**
- Código organizado em camadas
- Fácil localizar e modificar funcionalidades
- Documentação clara

### 4. **Escalabilidade**
- Fácil adicionar novos endpoints
- Fácil adicionar novos Use Cases
- Container gerencia dependências automaticamente

## 🧪 Testes

### Executar Testes

```bash
# Todos os testes
npm test

# Apenas testes unitários
npm run test:unit

# Apenas testes de integração
npm run test:integration

# Modo watch
npm run test:watch
```

### Resultados

```
✅ 231 testes passando
✅ 17 suítes de testes
✅ Tempo: ~3 segundos
✅ 0 falhas
```

## 🚀 Iniciar Servidor

### Desenvolvimento

```bash
npm run dev
```

### Produção

```bash
npm start
```

### Saída Esperada

```
🚀 ========================================
🚀 Servidor Bolão Privado - Clean Architecture
🚀 ========================================
🚀 Porta: 3000
🚀 Ambiente: development
🚀 Container DI: 33 dependências
🚀 ========================================
🚀 URLs disponíveis:
🚀   - http://localhost:3000/
🚀   - http://localhost:3000/login
🚀   - http://localhost:3000/admin
🚀   - http://localhost:3000/health
🚀 ========================================
```

## 🔌 Endpoints Disponíveis

### HTML Pages

- `GET /` - Página inicial
- `GET /login` - Página de login
- `GET /admin` - Painel administrativo

### API - Autenticação

- `POST /auth/registro` - Registrar usuário
- `POST /auth/login` - Fazer login
- `POST /auth/logout` - Fazer logout
- `GET /auth/me` - Obter usuário atual

### API - Apostas

- `POST /apostas` - Criar aposta
- `GET /minhas-apostas` - Listar minhas apostas
- `POST /apostas/simular` - Simular retorno
- `GET /historico` - Histórico de apostas

### API - Eventos

- `GET /eventos/ativo` - Obter evento ativo
- `POST /eventos` - Criar novo evento (Admin)
- `PATCH /eventos/ativo/apostas` - Abrir/fechar apostas (Admin)
- `POST /eventos/ativo/vencedor` - Definir vencedor (Admin)
- `POST /eventos/resetar` - Novo evento (Admin)

### Utilitários

- `GET /health` - Health check

## 🛡️ Segurança

### Middlewares Implementados

1. **Authentication** - Verifica sessão ativa
2. **Authorization** - Verifica permissões (Admin, Super Admin)
3. **Error Handler** - Tratamento centralizado de erros

### Configuração de Sessão

```javascript
{
    secret: 'bolao-privado-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,      // true em produção (HTTPS)
        httpOnly: true,     // Protege contra XSS
        maxAge: 86400000    // 24 horas
    }
}
```

## 📊 Comparação: Antes vs Depois

| Métrica | Antes (Monolítico) | Depois (Clean Arch) | Melhoria |
|---------|-------------------|---------------------|----------|
| **Linhas em server.js** | 1084 | 12 | **99% redução** |
| **Separação de concerns** | ❌ Não | ✅ Sim | ✅ |
| **Testabilidade** | ❌ Difícil | ✅ Fácil | ✅ |
| **Manutenibilidade** | ❌ Baixa | ✅ Alta | ✅ |
| **Dependências explícitas** | ❌ Não | ✅ Sim | ✅ |
| **Performance** | ~3s testes | ~3s testes | ⚖️ Igual |
| **Testes passando** | 231 | 231 | ⚖️ Igual |

## 🔧 Troubleshooting

### Erro: "Cannot find module"

```bash
# Reinstalar dependências
npm install
```

### Erro: "Port 3000 already in use"

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Erro: Database locked

```bash
# Remover database e reiniciar
rm bolao.db
npm start
```

## 📖 Referências

- [Express.js Documentation](https://expressjs.com/)
- [Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Dependency Injection Pattern](https://martinfowler.com/articles/injection.html)

## ✅ Checklist de Validação

- [x] Servidor carrega sem erros
- [x] Container DI funciona (33 dependências)
- [x] Todas as rotas estão registradas
- [x] Error Handler está ativo
- [x] Sessões funcionam corretamente
- [x] Arquivos estáticos são servidos
- [x] 231 testes passando
- [x] Graceful shutdown implementado
- [x] Health check disponível

---

**Status:** ✅ Completo e em Produção  
**Última Atualização:** 2026-01-19  
**Testes:** 231 passando  
**Performance:** ~3 segundos para executar todos os testes
