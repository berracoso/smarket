# 🧪 Guia de Testes - Sistema de Segurança e UX

## ⚡ Testes Rápidos (5 minutos)

### Servidor
```bash
npm start
```
✅ Servidor rodando em: http://localhost:3000

---

## 1️⃣ Teste Flash Messages

### Passo 1: Fazer uma Aposta
1. Acesse http://localhost:3000
2. Login: `admin@bolao.com` / `senha_definida_no_env` (Super Admin não pode apostar)
   - **OU** Crie uma conta nova (Usuário Comum)
3. Selecione um time
4. Digite um valor (ex: 100)
5. Clique em "Confirmar Aposta"

**✅ Resultado Esperado:**
- Flash Message **VERDE** aparece no canto superior direito
- Mensagem: "✅ Aposta confirmada! Retorno estimado: R$ X.XX"
- Mensagem desaparece após 5 segundos
- Botão de fechar (×) funciona

### Passo 2: Validação de Erro
1. Tente apostar **sem selecionar time**
2. Clique em "Confirmar Aposta"

**✅ Resultado Esperado:**
- Flash Message **VERMELHA** aparece
- Mensagem: "Por favor, selecione um time"

### Passo 3: Admin - Promover Usuário
1. Login como Super Admin: `admin@bolao.com` / `senha_definida_no_env`
2. Acesse http://localhost:3000/admin
3. Na seção "Gestão de Usuários", clique em "Promover" em um Usuário Comum
4. Confirme a ação

**✅ Resultado Esperado:**
- Flash Message **VERDE** aparece
- Mensagem: "✅ [Nome] foi promovido a Administrador"
- Lista de usuários atualiza automaticamente

---

## 2️⃣ Teste Middle-Check de Permissões

### ⚠️ IMPORTANTE: Use dois navegadores diferentes (ou janela anônima)

### Cenário A: Revogação de Permissão Durante Ação

**Preparação:**
1. Crie um novo usuário em http://localhost:3000
2. Login como Super Admin em **Navegador 1**
3. Promova o usuário criado a Administrador
4. Faça logout do Super Admin

**Teste:**

**Navegador 1 (Admin Promovido):**
1. Login com o usuário promovido
2. Acesse http://localhost:3000/admin
3. Navegue pela página (não faça nada ainda)

**Navegador 2 (Super Admin):**
1. Login como Super Admin: `admin@bolao.com` / `senha_definida_no_env`
2. Acesse http://localhost:3000/admin
3. Na lista de usuários, encontre o Admin promovido
4. Clique em **"Rebaixar"**
5. Confirme a ação

**Navegador 1 (Volte para ele):**
1. **SEM fazer refresh**, clique em qualquer botão (ex: "Abrir Apostas", "Fechar Apostas")

**✅ Resultado Esperado:**
- ❌ Flash Message **VERMELHA** aparece imediatamente
- 💬 Mensagem: "Você não tem mais permissão para acessar esta área."
- ⏱️ Após 2 segundos: **Redirecionamento automático** para http://localhost:3000
- 🎯 **CRITICAL:** Ação NÃO é executada no backend

---

### Cenário B: Detecção Passiva (Heartbeat)

**Teste:**

**Navegador 1 (Admin Promovido):**
1. Login com o usuário promovido
2. Acesse http://localhost:3000/admin
3. **DEIXE A PÁGINA ABERTA SEM FAZER NADA** (idle)
4. Aguarde 10 segundos

**Navegador 2 (Super Admin):**
1. Login como Super Admin
2. Acesse http://localhost:3000/admin
3. Rebaixe o Admin promovido
4. Aguarde

**Navegador 1 (Observar):**
1. **NÃO toque em nada**
2. Aguarde até 30 segundos

**✅ Resultado Esperado:**
- 🔍 Dentro de 30 segundos, o heartbeat detecta a perda de permissão
- 💬 Flash Message **VERMELHA** aparece automaticamente
- 🔄 Redirecionamento automático para `/`
- 📡 No console (F12): "🔄 Verificação periódica de permissões iniciada (30s)"

---

### Cenário C: Refresh da Página

**Teste:**

**Navegador 1 (Admin Promovido):**
1. Login com o usuário promovido
2. Acesse http://localhost:3000/admin

**Navegador 2 (Super Admin):**
1. Rebaixe o usuário

**Navegador 1:**
1. Pressione **F5** (refresh)

**✅ Resultado Esperado:**
- ❌ Backend retorna 403 imediatamente
- 🔄 Redirecionamento instantâneo para `/`
- 💬 Flash Message pode aparecer brevemente

---

## 3️⃣ Teste de Fallback (Sem JavaScript)

### Desabilitar JavaScript
1. Abra DevTools (F12)
2. Settings (F1) → Debugger → Disable JavaScript
3. Recarregue a página

**✅ Resultado Esperado:**
- Sistema continua funcional
- Backend ainda valida permissões
- 401/403 redirecionam mesmo sem JS

---

## 4️⃣ Teste de Console (Logs)

### Abrir Console do Navegador (F12)

**Ao carregar `/admin`:**
```
✅ Permission Interceptor ativado
📡 Todas as requisições fetch são monitoradas
🔒 Middle-check de permissões em tempo real habilitado
🔄 Verificação periódica de permissões iniciada (30s)
```

### Durante revogação de permissão:
```
Erro ao verificar permissões: {status: 403, ...}
```

---

## 5️⃣ Checklist de Validação

### Flash Messages
- [ ] ✅ Aposta bem-sucedida → Flash verde
- [ ] ❌ Erro de validação → Flash vermelho
- [ ] ⚠️ Apostas fechadas → Flash amarelo
- [ ] ℹ️ Mensagens informativas → Flash azul
- [ ] 🎨 Design consistente com topo da barra direita
- [ ] ⏱️ Desaparece após 5 segundos
- [ ] ❌ Botão de fechar funciona
- [ ] 📱 Responsivo em tela pequena

### Middle-Check
- [ ] 🔒 Middleware valida permissão a cada requisição
- [ ] ❌ 403 retornado se permissão revogada
- [ ] 💬 Flash Message exibe erro personalizado
- [ ] 🔄 Redirecionamento automático após 2s
- [ ] 📡 Heartbeat de 30s funciona na página `/admin`
- [ ] 🔍 Detecção passiva sem ação do usuário
- [ ] 🔄 Refresh detecta perda de permissão
- [ ] 🛡️ Ação não executada no backend após 403

### RBAC (Controle de Acesso)
- [ ] 🚫 Super Admin não pode apostar
- [ ] ✅ Admin pode apostar e gerenciar
- [ ] 👤 Usuário Comum só pode apostar
- [ ] 🔒 Super Admin pode rebaixar Admins
- [ ] 🔒 Admin pode promover Usuários
- [ ] ❌ Admin NÃO pode rebaixar outros Admins

---

## 🐛 Problemas Comuns

### Flash Message não aparece
- ✅ Verificar se `flash-message.js` está carregando
- ✅ Abrir console (F12) e procurar erros
- ✅ Verificar se CSS está carregando

### Heartbeat não funciona
- ✅ Verificar se está na página `/admin`
- ✅ Console deve mostrar: "🔄 Verificação periódica..."
- ✅ Aguardar até 30 segundos

### Permissão não revogada
- ✅ Verificar se o backend foi reiniciado
- ✅ Verificar logs do servidor Node.js
- ✅ Testar rota `/auth/check-permissions` manualmente

---

## 📊 Resultados Esperados

### Teste Completo (todos os cenários)
- ⏱️ Tempo: ~10 minutos
- ✅ Flash Messages funcionando em 100% dos casos
- ✅ Middle-check detectando revogação em <2s (ação ativa)
- ✅ Heartbeat detectando em <30s (passivo)
- ✅ Zero execuções de ações após revogação

---

## 🎯 Critério de Sucesso

**Sistema APROVADO se:**
1. ✅ Todas as Flash Messages aparecem corretamente
2. ✅ Revogação detectada antes de executar ação (403)
3. ✅ Redirecionamento automático funciona
4. ✅ Heartbeat detecta mudanças passivamente
5. ✅ Zero falhas de segurança (ações executadas após revogação)

---

## 📝 Relatório de Bugs

Se encontrar problemas, documente:
- 🔍 O que você estava fazendo
- ❌ O que aconteceu (com prints)
- ✅ O que deveria acontecer
- 🖥️ Navegador e versão
- 📋 Console (F12) - erros JavaScript

---

**Versão:** 1.0  
**Última Atualização:** 14/01/2026
