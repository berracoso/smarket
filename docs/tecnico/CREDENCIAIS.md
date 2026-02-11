# 🔐 Credenciais de Acesso - Bolão Privado

## Super Administrador (Gestão Pura)

### Credenciais
Configuradas no arquivo `.env`:
- **ADMIN_EMAIL** - Email do super administrador (padrão: `admin@bolao.com`)
- **ADMIN_PASSWORD** - Senha do super administrador

⚠️ **Configure o `.env` antes de executar `npm run setup`**

### Características
- ✅ Acesso total ao painel administrativo
- ✅ Pode promover usuários comuns a Administradores
- ✅ Pode rebaixar Administradores a usuários comuns
- ✅ Gerencia eventos, apostas e vencedores
- ❌ **NÃO PODE APOSTAR** (conta de gestão pura)

---

## Hierarquia de Usuários

### 1. Super Administrador 🔴
- **Perfil:** Gestão máxima do sistema
- **Pode Apostar:** ❌ NÃO
- **Acessa Admin:** ✅ SIM
- **Promover Usuários:** ✅ SIM
- **Rebaixar Admins:** ✅ SIM (exclusivo)

### 2. Administrador Promovido 🟡
- **Perfil:** Gestão + Participação
- **Pode Apostar:** ✅ SIM
- **Acessa Admin:** ✅ SIM
- **Promover Usuários:** ✅ SIM
- **Rebaixar Admins:** ❌ NÃO

### 3. Usuário Comum 🔵
- **Perfil:** Apenas apostador
- **Pode Apostar:** ✅ SIM
- **Acessa Admin:** ❌ NÃO
- **Promover Usuários:** ❌ NÃO
- **Rebaixar Admins:** ❌ NÃO

---

## Tabela de Permissões

| Funcionalidade | Super Admin | Admin Promovido | Usuário Comum |
|----------------|:-----------:|:---------------:|:-------------:|
| Visualizar Página Principal | ✅ | ✅ | ✅ |
| **Realizar Apostas** | ❌ | ✅ | ✅ |
| Acessar Painel Admin | ✅ | ✅ | ❌ |
| Abrir/Fechar Apostas | ✅ | ✅ | ❌ |
| Definir Vencedor | ✅ | ✅ | ❌ |
| Novo evento | ✅ | ✅ | ❌ |
| Promover Usuários | ✅ | ✅ | ❌ |
| **Rebaixar Admins** | ✅ | ❌ | ❌ |

---

## Regras de Negócio Implementadas

### ✅ RF01: Reposicionamento do Header
- Botões de perfil e logout movidos para canto superior direito
- Padding-top adicionado ao header para evitar sobreposição
- Responsivo em Desktop e Mobile

### ✅ RF02: Hierarquia de Usuários
- Três níveis implementados: Super Admin, Admin Promovido, Usuário Comum
- Badges visuais para identificação (cores diferentes)
- Permissões diferenciadas conforme tabela acima

### ✅ RF03: Restrições do Super Administrador
- Super Admin **não pode apostar** (validado no backend)
- Formulário de apostas oculto na interface
- Mensagem explicativa com link para painel admin
- Erro 403 se tentar via API

### ✅ RF04: Gestão de Administradores
- Endpoint de promoção (Admin e Super Admin podem usar)
- Endpoint de rebaixamento (apenas Super Admin)
- Interface no painel admin com botões contextuais
- Confirmações antes de ações críticas

---

## Como Usar

### 1. Primeiro Acesso
```
URL: http://localhost:3000/login
Email: admin@bolao.com
Senha: senha_registrada_no_env
```

### 2. Registrar Novos Usuários
- Clique em "Registrar" na tela de login
- Novos usuários começam como "Usuário Comum"
- Podem apostar normalmente

### 3. Promover Alguém a Admin
1. Login como Super Admin ou Admin Promovido
2. Ir para: http://localhost:3000/admin
3. Seção: "👥 Gestão de Usuários"
4. Clicar em "⬆️ Promover" no usuário desejado

### 4. Rebaixar um Admin (apenas Super Admin)
1. Login como Super Admin
2. Ir para: http://localhost:3000/admin
3. Seção: "👥 Gestão de Usuários"
4. Clicar em "⬇️ Rebaixar" no admin desejado

---

## Segurança

### Backend (Server-Side)
- ✅ Sessões com express-session
- ✅ Senhas hasheadas com bcryptjs
- ✅ Middlewares de autenticação e autorização
- ✅ Validação de perfil em rotas críticas
- ✅ Bloqueio de apostas para Super Admin no servidor

### Frontend (Client-Side)
- ✅ Verificação de autenticação ao carregar páginas
- ✅ Redirecionamento automático se não autenticado
- ✅ Ocultação de elementos baseada em perfil
- ✅ Badges visuais para identificação rápida
- ✅ Botões de ação aparecem conforme permissões

---

## Taxa da Plataforma

O sistema cobra **5% de taxa** sobre o prêmio total:
- Total apostado: R$ 100
- Taxa (5%): R$ 5
- Prêmio líquido: R$ 95

A taxa é descontada automaticamente antes da distribuição aos vencedores.

---

## Endpoints da API

### Autenticação
- `POST /auth/registro` - Criar conta
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout  
- `GET /auth/me` - Sessão atual

### Gestão de Usuários
- `GET /usuarios` - Listar (requer Admin)
- `POST /usuarios/:id/promover` - Promover (requer Admin)
- `POST /usuarios/:id/rebaixar` - Rebaixar (requer Super Admin)

### Apostas
- `POST /apostas` - Criar (requer Auth, exceto Super Admin)
- `GET /apostas` - Listar
- `GET /resumo` - Resumo

### Administração
- `POST /fechar` - Fechar apostas (requer Admin)
- `POST /abrir` - Abrir apostas (requer Admin)
- `POST /vencedor` - Definir vencedor (requer Admin)
- `POST /reset` - Novo evento (requer Admin)

---

**✅ Todos os requisitos RF01, RF02, RF03 e RF04 foram implementados com sucesso!**

- Este usuário tem **privilégios de administrador**
- Pode acessar o **Painel Administrativo** em `/admin`
- Pode **fechar/abrir apostas**
- Pode **definir o vencedor**
- Pode **resetar o evento**

---

## Outros Usuários

Usuários comuns podem se registrar na página de login (`/login`) e terão acesso apenas para:
- Fazer apostas
- Visualizar o mercado
- Ver suas próprias apostas

Eles **NÃO** têm acesso ao painel administrativo.

---

## Segurança

- As senhas são criptografadas com **bcrypt** (10 rounds)
- As sessões são gerenciadas com **express-session**
- Cookies de sessão duram 24 horas
- Rotas administrativas são protegidas por middleware

---

## Estrutura de Permissões

```
Super Admin (admin@bolao.com)
├── Acesso ao Painel Admin (/admin)
├── Pode fechar/abrir apostas
├── Pode definir vencedor
├── Pode Novo evento
└── Pode fazer apostas (como usuário comum)

Usuário Comum (registrado)
├── Pode fazer apostas
├── Pode visualizar mercado
└── NÃO tem acesso ao /admin
```
