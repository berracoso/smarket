# 🎯 Bolão Privado - Sistema de Apostas com SQLite

Sistema completo de apostas entre amigos com **persistência de dados em SQLite**.

## ✨ Novidade: Banco de Dados SQLite

Os dados agora são armazenados permanentemente em `bolao.db`. Você não precisa mais recriar perfis toda vez que reinicia o servidor!

### 🗄️ Estrutura do Banco de Dados

#### Tabela `usuarios`
```sql
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    isAdmin INTEGER DEFAULT 0,
    isSuperAdmin INTEGER DEFAULT 0,
    tipo TEXT DEFAULT 'usuario',
    criadoEm TEXT DEFAULT CURRENT_TIMESTAMP
)
```

#### Tabela `apostas`
```sql
CREATE TABLE apostas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    nome TEXT NOT NULL,
    time TEXT NOT NULL,
    valor REAL NOT NULL,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES usuarios(id)
)
```

#### Tabela `evento`
```sql
CREATE TABLE evento (
    id TEXT PRIMARY KEY,
    times TEXT NOT NULL,
    aberto INTEGER DEFAULT 1,
    vencedor TEXT
)
```

## 🚀 Como Usar

```bash
# 1. Instalar dependências (inclui sqlite3)
npm install

# 2. Iniciar servidor
npm start
```

Na primeira execução, o sistema:
- ✅ Cria automaticamente o arquivo `bolao.db`
- ✅ Cria todas as tabelas necessárias
- ✅ Insere o Super Admin padrão
- ✅ Cria o evento padrão com 4 times

## 🔐 Credenciais Padrão

**Super Administrador:**
- Email: `admin@bolao.com`
- Senha: `senha_definida_no_env`

Este usuário é criado automaticamente na primeira execução.

## 📦 Persistência de Dados

### O que é persistido:
- ✅ **Usuários** - Todos os perfis e suas permissões
- ✅ **Apostas** - Histórico completo de apostas
- ✅ **Evento** - Estado (aberto/fechado), vencedor, times

### Vantagens:
- 🔒 **Dados seguros** - Não são perdidos ao reiniciar
- 📊 **Histórico mantido** - Todas as apostas ficam registradas
- 👥 **Perfis permanentes** - Crie uma vez, use sempre
- 🔄 **Backup fácil** - Basta copiar o arquivo `bolao.db`

## 🛠️ Gerenciamento do Banco

### Ver todos os dados:
```
GET http://localhost:3000/dados
```

### Resetar apostas (manter usuários):
```
POST http://localhost:3000/reset
```
(Requer autenticação de admin)

### Backup manual:
```bash
# Copiar banco de dados
Copy-Item bolao.db bolao-backup.db
```

### Limpar tudo e começar do zero:
```bash
# Deletar banco e reiniciar servidor
Remove-Item bolao.db
npm start
```

## 👥 Hierarquia de Usuários (RBAC)

### 1️⃣ Super Administrador
- 🔴 Badge vermelho "SUPER ADMIN"
- ✅ Acesso total ao painel admin
- ✅ Promover/rebaixar administradores
- ✅ Gerenciar todos usuários
- ❌ **NÃO pode apostar** (conta de gestão)

### 2️⃣ Administrador Promovido
- 🟡 Badge amarelo "ADMIN"
- ✅ Acesso ao painel admin
- ✅ Promover usuários comuns
- ✅ Gerenciar eventos
- ✅ **PODE apostar normalmente**

### 3️⃣ Usuário Comum
- 🔵 Sem badge especial
- ✅ Fazer apostas
- ✅ Ver resumo do mercado
- ✅ Acompanhar suas apostas com retornos

## 📱 Interface

### Menu Lateral (Sidebar)
- **🎯 Fazer Apostas** - Interface principal
- **📋 Minhas Apostas** - Histórico com retornos estimados
- **👤 Minha Conta** - Dados, tipo e permissões
- **⚙️ Painel Admin** - Apenas para admins

### Cálculos Automáticos
- 📊 **Odds dinâmicas** - Calculadas em tempo real
- 💰 **Taxa de 5%** - Descontada do prêmio total
- 🎯 **Retorno estimado** - Mostrado antes de apostar
- 📈 **Lucro projetado** - Calculado automaticamente

## 🔧 Tecnologias

- **Backend:** Node.js + Express
- **Banco:** SQLite3
- **Autenticação:** express-session + bcryptjs
- **Frontend:** HTML5 + CSS3 + JavaScript vanilla

## 📄 Arquivos do Projeto

```
bolao-privado/
├── server.js           # Backend com SQLite
├── bolao.db           # Banco de dados (criado automaticamente)
├── package.json       # Dependências
├── public/
│   ├── index.html     # Página principal com sidebar
│   ├── admin.html     # Painel administrativo
│   └── login.html     # Login/Registro
├── CREDENCIAIS.md     # Documentação de acesso
└── README-SQLITE.md   # Este arquivo
```

## ⚠️ Importante

- O arquivo `bolao.db` **não deve** ser versionado no Git (já está no .gitignore)
- Faça backups regulares do `bolao.db` para não perder dados
- A senha do Super Admin pode ser alterada diretamente no banco se necessário

## 🐛 Solução de Problemas

### Erro ao iniciar:
```bash
# Verificar se sqlite3 está instalado
npm list sqlite3

# Reinstalar se necessário
npm install sqlite3 --save
```

### Resetar Super Admin:
```bash
# Deletar banco e recriar
Remove-Item bolao.db
npm start
```

### Banco corrompido:
```bash
# Usar backup
Remove-Item bolao.db
Copy-Item bolao-backup.db bolao.db
npm start
```

---

**Desenvolvido com ❤️ para apostas entre amigos**
