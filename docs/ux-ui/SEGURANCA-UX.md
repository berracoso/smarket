# 🔒 Sistema de Segurança e UX - Bolão Privado

## 📋 Resumo das Implementações

Este documento descreve as novas funcionalidades de segurança e experiência do usuário implementadas no sistema Bolão Privado.

---

## 1️⃣ Flash Messages (Toast Notifications)

### 🎯 Objetivo
Substituir todos os `window.alert()` por um sistema de notificações moderno e não-intrusivo.

### 📁 Arquivos Criados

#### `public/flash-message.js`
- **Classe:** `FlashMessage`
- **Métodos principais:**
  - `show(message, type, duration)` - Exibir mensagem personalizada
  - `success(message, duration)` - Mensagem de sucesso (verde)
  - `error(message, duration)` - Mensagem de erro (vermelho)
  - `warning(message, duration)` - Mensagem de aviso (amarelo)
  - `info(message, duration)` - Mensagem informativa (azul)
  - `clear()` - Limpar todas as mensagens

#### `public/flash-message.css`
- **Container:** Posicionado no canto superior direito (`top: 20px; right: 20px`)
- **Animações:** Entrada/saída suaves com `cubic-bezier`
- **Tipos visuais:**
  - ✅ Success: Verde (#10b981)
  - ❌ Error: Vermelho (#ef4444)
  - ⚠️ Warning: Amarelo (#f59e0b)
  - ℹ️ Info: Azul (#3b82f6)

### 🔧 Como Usar

```javascript
// Usando a instância global
flashMessage.success('Operação realizada com sucesso!');
flashMessage.error('Erro ao processar requisição');
flashMessage.warning('Atenção: Ação irreversível');
flashMessage.info('Processando sua solicitação...');

// Ou usando atalhos globais
showSuccess('Aposta confirmada!');
showError('Usuário não encontrado');
showWarning('As apostas estão fechadas');
showInfo('Carregando dados...');
```

### 📦 Integração

As mensagens aparecem automaticamente em:
- ✅ Confirmações de apostas
- 🔒 Bloqueios de permissão
- 👥 Gestão de usuários (promover/rebaixar)
- 🎯 Definição de vencedor
- 🔄 Reset de eventos
- ⚠️ Erros de validação

---

## 2️⃣ Middle-Check de Permissões (Validação em Tempo Real)

### 🎯 Objetivo
Garantir que as permissões do usuário sejam validadas em **tempo real** antes de cada ação administrativa.

### 🔐 Fluxo de Segurança

```
1. Usuário clica em botão de ação admin
   ↓
2. Fetch envia requisição para o backend
   ↓
3. Middleware requireAdmin/requireSuperAdmin executa
   ↓
4. Banco de dados é consultado em tempo real
   ↓
5a. Permissão OK → Ação executada ✅
5b. Permissão NEGADA → 403 retornado ❌
   ↓
6. Interceptor detecta 403
   ↓
7. Flash Message exibe erro
   ↓
8. Redirecionamento automático para /
```

### 🛠️ Implementação Backend

#### Middleware Atualizado (`server.js`)

```javascript
function requireAdmin(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ 
            erro: 'Não autenticado',
            tipo: 'auth_required',
            redirecionarPara: '/login'
        });
    }
    
    // VALIDAÇÃO EM TEMPO REAL
    db.get('SELECT * FROM usuarios WHERE id = ?', [req.session.userId], (err, usuario) => {
        if (err || !usuario || usuario.isAdmin !== 1) {
            return res.status(403).json({ 
                erro: 'Você não tem mais permissão para acessar esta área.',
                tipo: 'permission_revoked',
                redirecionarPara: '/',
                detalhes: 'Suas permissões de administrador foram removidas.'
            });
        }
        
        req.usuario = usuario;
        next();
    });
}
```

#### Nova Rota de Verificação

```javascript
GET /auth/check-permissions
```

Retorna o estado atual das permissões do usuário logado. Usada para verificação periódica.

### 📡 Implementação Frontend

#### `public/permission-interceptor.js`

**Características:**

1. **Interceptor de Fetch Global**
   - Sobrescreve `window.fetch`
   - Detecta status 401/403 automaticamente
   - Trata erros de forma centralizada

2. **Tratamento de Erros 403**
   ```javascript
   if (response.status === 403 && data.tipo === 'permission_revoked') {
       showError('Você não tem mais permissão para acessar esta área.', 7000);
       setTimeout(() => window.location.href = '/', 2000);
   }
   ```

3. **Heartbeat de Permissões**
   - Verifica permissões a cada 30 segundos
   - Ativo automaticamente na página `/admin`
   - Detecta revogação mesmo sem ação do usuário

```javascript
// Iniciar verificação periódica
startPermissionCheck(30000); // 30 segundos

// Parar verificação
stopPermissionCheck();
```

### 🎬 Cenário de Teste

**Situação:** Usuário com duas sessões abertas

1. **Sessão A:** Usuário Admin logado em `/admin` navegando
2. **Sessão B:** Super Admin rebaixa o usuário para Usuário Comum

**Comportamento Esperado:**

- **Em qualquer ação** (clique, refresh, requisição):
  - ❌ Backend retorna 403 com `permission_revoked`
  - 💬 Flash Message aparece: "Você não tem mais permissão para acessar esta área."
  - 🔄 Redirecionamento automático para `/` após 2 segundos

- **Heartbeat (a cada 30s):**
  - 🔍 Verifica `/auth/check-permissions`
  - 🚨 Detecta perda de permissão
  - 🔄 Redireciona mesmo sem ação do usuário

---

## 3️⃣ Estrutura de Resposta Padronizada

### ✅ Sucesso (200)
```json
{
  "sucesso": true,
  "mensagem": "Operação realizada com sucesso",
  "dados": { ... }
}
```

### 🔒 Não Autenticado (401)
```json
{
  "erro": "Não autenticado",
  "tipo": "auth_required",
  "redirecionarPara": "/login"
}
```

### ❌ Permissão Negada (403)
```json
{
  "erro": "Você não tem mais permissão para acessar esta área.",
  "tipo": "permission_revoked",
  "redirecionarPara": "/",
  "detalhes": "Suas permissões de administrador foram removidas."
}
```

---

## 4️⃣ Arquivos Modificados

### Backend
- ✅ `server.js`
  - Middleware `requireAuth` atualizado
  - Middleware `requireAdmin` com middle-check
  - Middleware `requireSuperAdmin` com middle-check
  - Nova rota `/auth/check-permissions`

### Frontend
- ✅ `public/index.html`
  - Importação de `flash-message.css`
  - Importação de `flash-message.js`
  - Importação de `permission-interceptor.js`
  - Função `mostrarAlerta` atualizada

- ✅ `public/admin.html`
  - Importação de `flash-message.css`
  - Importação de `flash-message.js`
  - Importação de `permission-interceptor.js`
  - Função `mostrarAlerta` atualizada
  - Heartbeat automático de 30s

- ✅ `public/login.html`
  - Importação de `flash-message.css`
  - Importação de `flash-message.js`
  - Importação de `permission-interceptor.js`

---

## 5️⃣ Rotas Protegidas

### 🔐 Middleware `requireAdmin`
- `POST /apostas` (Super Admin não pode)
- `GET /usuarios`
- `POST /usuarios/:id/promover`
- `POST /evento/abrir-fechar`
- `POST /vencedor`
- `POST /reset`

### 🔐 Middleware `requireSuperAdmin`
- `POST /usuarios/:id/rebaixar`

### 🔓 Middleware `requireAuth`
- `GET /resumo`
- `GET /minhas-apostas`
- `GET /auth/check-permissions`

---

## 6️⃣ Testes Recomendados

### Teste 1: Flash Messages
1. ✅ Fazer uma aposta → Verificar mensagem de sucesso verde
2. ✅ Tentar apostar sem time → Verificar mensagem de erro vermelha
3. ✅ Promover usuário → Verificar mensagem de sucesso
4. ✅ Definir vencedor → Verificar mensagem informativa

### Teste 2: Middle-Check de Permissões

**Cenário A: Ação Imediata**
1. Abrir duas sessões (navegadores diferentes)
2. Sessão 1: Login como Admin, acessar `/admin`
3. Sessão 2: Login como Super Admin
4. Sessão 2: Rebaixar Admin para Usuário Comum
5. Sessão 1: Clicar em qualquer botão de gestão
6. ✅ **Resultado:** 403 detectado, Flash Message exibida, redirecionamento para `/`

**Cenário B: Detecção Passiva (Heartbeat)**
1. Abrir duas sessões
2. Sessão 1: Login como Admin, acessar `/admin`
3. Aguardar 10 segundos (deixar idle)
4. Sessão 2: Rebaixar Admin
5. ✅ **Resultado:** Dentro de 30s, heartbeat detecta, Flash Message aparece, redirecionamento

**Cenário C: Refresh**
1. Login como Admin, acessar `/admin`
2. Outra sessão rebaixa o usuário
3. Fazer refresh (F5) na página `/admin`
4. ✅ **Resultado:** Backend nega acesso, redirecionamento instantâneo

---

## 7️⃣ Configurações

### Duração das Flash Messages
```javascript
// Padrão: 5000ms (5 segundos)
showSuccess('Mensagem', 3000); // 3 segundos
showError('Erro crítico', 7000); // 7 segundos
```

### Intervalo do Heartbeat
```javascript
// Padrão: 30000ms (30 segundos)
startPermissionCheck(15000); // 15 segundos
startPermissionCheck(60000); // 60 segundos
```

---

## 8️⃣ Compatibilidade

- ✅ Navegadores modernos (Chrome, Firefox, Edge, Safari)
- ✅ Responsivo (adapta-se a telas pequenas)
- ✅ Fallback para alertas antigos se Flash Message não carregar
- ✅ Funciona com e sem JavaScript (degrada graciosamente)

---

## 9️⃣ Logs e Debug

### Console do Navegador
```
✅ Permission Interceptor ativado
📡 Todas as requisições fetch são monitoradas
🔒 Middle-check de permissões em tempo real habilitado
🔄 Verificação periódica de permissões iniciada (30s)
```

### Backend (server.js)
- Mensagens de erro detalhadas com `tipo` e `redirecionarPara`
- Logs de consultas ao banco para debug

---

## 🎉 Conclusão

O sistema agora possui:

1. ✅ **UX Moderna:** Flash Messages não-intrusivas
2. ✅ **Segurança em Tempo Real:** Middle-check de permissões a cada requisição
3. ✅ **Detecção Passiva:** Heartbeat detecta revogação mesmo idle
4. ✅ **Respostas Padronizadas:** JSON estruturado com tipos e redirecionamentos
5. ✅ **Graceful Degradation:** Fallbacks para compatibilidade

---

## 📞 Suporte

Para dúvidas ou problemas:
- Verificar console do navegador (F12)
- Verificar logs do servidor Node.js
- Consultar este documento para fluxos esperados

---

**Versão:** 1.0  
**Data:** 14/01/2026  
**Desenvolvedor:** GitHub Copilot (Claude Sonnet 4.5)
