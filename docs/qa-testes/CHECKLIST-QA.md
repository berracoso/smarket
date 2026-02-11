# ✅ Checklist de Homologação - Bolão Privado

## 📋 Aditivo à Especificação de Requisitos

### ✅ RF05: Rotas Amigáveis (Admin)
- [x] URL exibe `/admin` em vez de `/admin.html`
- [x] Menu lateral aponta para `/admin` (sem extensão)
- [x] Link no alerta de Super Admin aponta para `/admin`
- [x] Servidor responde corretamente em `GET /admin`
- [x] Sessão do usuário é mantida ao acessar rota amigável

**Status:** ✅ IMPLEMENTADO

---

### ✅ RF06: Cálculo de Retorno em "Minhas Apostas"
- [x] Fórmula corrigida: `Valor_Receber = (valor_aposta / total_time) * total_premio`
- [x] Taxa de 5% aplicada corretamente: `total_premio = total_geral * 0.95`
- [x] Retorno não mostra mais zero
- [x] Cálculo considera todas as apostas existentes no banco
- [x] Lucro estimado calculado corretamente: `retorno - valor_aposta`

**Status:** ✅ IMPLEMENTADO

---

### ✅ RF01: Reposicionamento do Header
- [x] Barra superior fixa criada (`.top-bar`)
- [x] Nome do usuário movido para o topo direito
- [x] Botão "Sair" movido para o topo direito
- [x] Header não colide mais com título "Bolão Privado"
- [x] Design responsivo mantido (mobile)

**Status:** ✅ IMPLEMENTADO

---

## 🔐 Matriz de Permissões (RBAC)

### Super Admin
- [x] ✅ Visualizar Home
- [x] ❌ Realizar Apostas (bloqueado backend e frontend)
- [x] ✅ Acessar `/admin`
- [x] ✅ Promover Usuários a Admin
- [x] ✅ Rebaixar Admin para Comum (exclusivo)
- [x] ❌ Visualizar "Minhas Apostas" (aposta bloqueada)

### Admin (Promovido)
- [x] ✅ Visualizar Home
- [x] ✅ Realizar Apostas
- [x] ✅ Acessar `/admin`
- [x] ✅ Promover Usuários a Admin
- [x] ❌ Rebaixar Admin para Comum (somente Super Admin)
- [x] ✅ Visualizar "Minhas Apostas" com retornos corretos

### Usuário Comum
- [x] ✅ Visualizar Home
- [x] ✅ Realizar Apostas
- [x] ❌ Acessar `/admin`
- [x] ❌ Promover/Rebaixar usuários
- [x] ✅ Visualizar "Minhas Apostas" com retornos corretos

**Status:** ✅ VALIDADO

---

## 🧪 Testes de Validação

### Teste 1: Rota Amigável
```bash
1. Acessar: http://localhost:3000/admin
2. Verificar URL no navegador: deve mostrar /admin (não /admin.html)
3. Clicar no menu "Painel Admin"
4. Verificar URL: deve permanecer /admin
```
**Resultado Esperado:** ✅ URL amigável mantida

---

### Teste 2: Cálculo de Retorno
```bash
1. Login como usuário comum (ou admin promovido)
2. Fazer aposta de R$ 100,00 no Time A
3. Acessar "Minhas Apostas" no menu lateral
4. Verificar campo "Retorno se vencer"
```
**Fórmula:**
- Total geral: R$ 100,00
- Taxa plataforma (5%): R$ 5,00
- Prêmio líquido: R$ 95,00
- Total no Time A: R$ 100,00
- Retorno: (100/100) * 95 = **R$ 95,00**

**Resultado Esperado:** ✅ Valor calculado corretamente (não zero)

---

### Teste 3: Permissões Super Admin
```bash
1. Login: admin@bolao.com / senha_definida_no_env
2. Verificar se botão "Confirmar Aposta" está desabilitado
3. Verificar alerta: "Conta de Gestão: Super Admin não pode apostar"
4. Acessar painel /admin
5. Verificar botão "Rebaixar" para admins promovidos
```
**Resultado Esperado:** 
- ❌ Super Admin não consegue apostar
- ✅ Consegue acessar painel admin
- ✅ Vê botão de rebaixar

---

### Teste 4: Permissões Admin Promovido
```bash
1. Super Admin promove usuário comum
2. Logout e login com usuário promovido
3. Fazer aposta de R$ 50,00
4. Verificar acesso ao /admin
5. Tentar rebaixar outro admin
```
**Resultado Esperado:**
- ✅ Admin promovido pode apostar
- ✅ Consegue acessar painel admin
- ❌ NÃO vê botão de rebaixar (somente Super Admin)

---

### Teste 5: UI/UX - Barra Superior
```bash
1. Fazer login
2. Verificar barra superior fixa no topo
3. Nome do usuário aparece no canto direito
4. Botão "Sair" aparece ao lado
5. Rolar página para baixo
```
**Resultado Esperado:**
- ✅ Barra permanece fixa no topo
- ✅ Não colide com título "Bolão Privado"
- ✅ Responsiva em mobile

---

## 📊 Resumo de Implementações

| Requisito | Status | Prioridade | Testado |
|-----------|--------|------------|---------|
| RF05 - Rotas Amigáveis | ✅ Implementado | Alta | ✅ |
| RF06 - Cálculo Retorno | ✅ Corrigido | Crítica | ✅ |
| RF01 - Reposição Header | ✅ Implementado | Média | ✅ |
| RBAC - Super Admin | ✅ Validado | Alta | ✅ |
| RBAC - Admin Promovido | ✅ Validado | Alta | ✅ |
| RBAC - Usuário Comum | ✅ Validado | Alta | ✅ |

---

## 🚀 Deploy e Produção

### Arquivos Modificados:
- ✅ `server.js` - Correção cálculo retorno, rotas HTML
- ✅ `public/index.html` - Rotas amigáveis, barra superior
- ✅ `public/admin.html` - Rotas de dados

### Banco de Dados:
- ✅ Estrutura mantida (sem migrations necessárias)
- ✅ Compatível com dados existentes

### Dependências:
- ✅ Nenhuma dependência nova adicionada
- ✅ Compatível com versão atual

---

## ✅ Aprovação Final

- [x] Todos os requisitos implementados
- [x] Cálculos corrigidos e validados
- [x] Permissões RBAC funcionando corretamente
- [x] UI/UX melhorada
- [x] Rotas amigáveis implementadas
- [x] Servidor reiniciado e funcional

**Status Geral:** ✅ PRONTO PARA HOMOLOGAÇÃO

**Data:** 14/01/2026  
**Versão:** 2.0 (Com SQLite + Melhorias)

---

## 📝 Notas Técnicas

### Cálculo de Retorno (Detalhado)
```javascript
// Cenário: 3 apostas no sistema
// Time A: R$ 100 (Aposta 1) + R$ 50 (Aposta 2) = R$ 150
// Time B: R$ 100 (Aposta 3)
// Total Geral: R$ 250

const totalGeral = 250; // Soma de todas apostas
const taxaPlataforma = 250 * 0.05; // R$ 12.50 (5%)
const totalPremio = 250 * 0.95; // R$ 237.50 (95%)

// Se Time A ganhar:
const totalTimeA = 150;
const retornoAposta1 = (100 / 150) * 237.50; // R$ 158.33
const retornoAposta2 = (50 / 150) * 237.50; // R$ 79.17

// Lucro:
const lucroAposta1 = 158.33 - 100; // R$ 58.33
const lucroAposta2 = 79.17 - 50; // R$ 29.17
```

Esta fórmula garante que:
1. 5% sempre vai para plataforma
2. 95% distribuído proporcionalmente entre vencedores
3. Retorno nunca é zero (a menos que não haja apostas)
