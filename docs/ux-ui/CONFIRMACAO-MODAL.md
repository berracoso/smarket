# 🎯 Sistema de Confirmação Modal - Documentação

## 📋 Visão Geral

Sistema de modais de confirmação personalizados que substituem o `window.confirm()` nativo do JavaScript, proporcionando uma experiência moderna, visual e consistente com o design do Bolão Privado.

---

## ✨ Características

- ✅ **Totalmente Assíncrono:** Baseado em Promises para facilitar uso com async/await
- 🎨 **4 Tipos Visuais:** Warning, Danger, Info, Success
- 🎭 **Animações Suaves:** Fade-in, slide-up e bounce
- 📱 **Responsivo:** Adapta-se a telas pequenas
- ⌨️ **Acessível:** Suporte a teclado (Tab, Enter, Esc)
- 🔒 **Backdrop Blur:** Efeito de desfoque no fundo
- 🎯 **Customizável:** Texto dos botões, título, ícone

---

## 🚀 Como Usar

### Básico

```javascript
// Confirmação simples
const confirmado = await showConfirm('Deseja continuar?');
if (confirmado) {
    // Usuário clicou em "Confirmar"
} else {
    // Usuário clicou em "Cancelar" ou fechou o modal
}
```

### Com Opções

```javascript
const confirmado = await showConfirm(
    'Mensagem com <strong>HTML</strong><br>Suporta múltiplas linhas',
    {
        title: 'Título Personalizado',
        confirmText: 'Sim, Continuar',
        cancelText: 'Não, Cancelar',
        type: 'warning', // 'warning', 'danger', 'info', 'success'
        icon: '⚠️'
    }
);
```

---

## 🎨 Tipos de Confirmação

### 1. Warning (Padrão Amarelo)

Para ações que requerem atenção mas não são destrutivas.

```javascript
const confirmado = await confirmWarning(
    'As apostas serão fechadas.<br>Você poderá reabri-las depois.',
    {
        title: '🔒 Fechar Apostas',
        confirmText: 'Fechar',
        cancelText: 'Cancelar'
    }
);
```

**Cor do Botão:** Amarelo (#f59e0b)  
**Uso:** Fechar apostas, alterar status

---

### 2. Danger (Vermelho)

Para ações destrutivas ou irreversíveis.

```javascript
const confirmado = await confirmDanger(
    'Esta ação irá apagar <strong>TODAS as apostas</strong>.<br><br>Esta ação é <strong>IRREVERSÍVEL</strong>!',
    {
        title: '🚨 ATENÇÃO: Reset Total',
        confirmText: 'Sim, Resetar Tudo',
        cancelText: 'Cancelar'
    }
);
```

**Cor do Botão:** Vermelho (#ef4444)  
**Uso:** Deletar, resetar, remover

---

### 3. Info (Azul)

Para ações informativas ou administrativas.

```javascript
const confirmado = await showConfirm(
    `Promover <strong>${nome}</strong> a Administrador?<br><br>Ele terá acesso ao painel admin.`,
    {
        title: 'Promover Usuário',
        confirmText: 'Promover',
        type: 'info',
        icon: '👑'
    }
);
```

**Cor do Botão:** Azul (#3b82f6)  
**Uso:** Promover usuário, ações administrativas

---

### 4. Success (Verde)

Para ações positivas ou de conclusão.

```javascript
const confirmado = await showConfirm(
    `Confirmar <strong>${time}</strong> como vencedor?<br><br>Os ganhos serão calculados.`,
    {
        title: '🏆 Definir Vencedor',
        confirmText: 'Confirmar Vencedor',
        type: 'success',
        icon: '🏆'
    }
);
```

**Cor do Botão:** Verde (#10b981)  
**Uso:** Confirmar vencedor, finalizar processo

---

## 📦 Opções Disponíveis

| Opção | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `title` | string | "Confirmação" | Título do modal |
| `confirmText` | string | "Confirmar" | Texto do botão de confirmação |
| `cancelText` | string | "Cancelar" | Texto do botão de cancelamento |
| `type` | string | "warning" | Tipo visual: 'warning', 'danger', 'info', 'success' |
| `icon` | string | "⚠️" | Emoji ou ícone exibido no topo |

---

## 🎯 Exemplos de Uso Real

### Promover Usuário

```javascript
async function promoverUsuario(userId, nome) {
    const confirmado = await showConfirm(
        `Promover <strong>${nome}</strong> a Administrador?<br><br>Ele poderá acessar o painel admin.`,
        {
            title: 'Promover Usuário',
            confirmText: 'Promover',
            type: 'info',
            icon: '👑'
        }
    );
    
    if (!confirmado) return;
    
    // Fazer a requisição...
}
```

### Rebaixar Administrador

```javascript
async function rebaixarUsuario(userId, nome) {
    const confirmado = await confirmWarning(
        `Rebaixar <strong>${nome}</strong> de Administrador?<br><br>Ele perderá acesso ao painel admin.`,
        {
            title: '⚠️ Rebaixar Administrador',
            confirmText: 'Rebaixar',
            cancelText: 'Cancelar'
        }
    );
    
    if (!confirmado) return;
    
    // Fazer a requisição...
}
```

### Novo evento (Ação Destrutiva)

```javascript
async function resetarEvento() {
    const confirmado = await confirmDanger(
        'Isso irá apagar <strong>TODAS as apostas</strong>.<br><br>Esta ação é <strong>IRREVERSÍVEL</strong>!',
        {
            title: '🚨 ATENÇÃO: Reset Total',
            confirmText: 'Sim, Resetar Tudo',
            cancelText: 'Cancelar'
        }
    );
    
    if (!confirmado) return;
    
    // Fazer a requisição...
}
```

### Definir Vencedor

```javascript
async function definirVencedor(time) {
    const confirmado = await showConfirm(
        `Confirmar <strong>${time}</strong> como vencedor?<br><br>Os ganhos serão calculados.`,
        {
            title: '🏆 Definir Vencedor',
            confirmText: 'Confirmar Vencedor',
            type: 'success',
            icon: '🏆'
        }
    );
    
    if (!confirmado) return;
    
    // Fazer a requisição...
}
```

---

## 🎨 Estrutura HTML

```html
<div id="confirm-modal" class="confirm-modal">
    <div class="confirm-overlay"></div>
    <div class="confirm-dialog confirm-warning">
        <div class="confirm-icon">⚠️</div>
        <div class="confirm-title">Confirmação</div>
        <div class="confirm-message">Mensagem aqui</div>
        <div class="confirm-buttons">
            <button class="confirm-btn confirm-btn-cancel">Cancelar</button>
            <button class="confirm-btn confirm-btn-confirm">Confirmar</button>
        </div>
    </div>
</div>
```

---

## 🎭 Animações

### Overlay (Fundo)
- **Entrada:** Fade-in de 0.2s
- **Saída:** Fade-out automático

### Dialog (Modal)
- **Entrada:** Slide-up + scale com cubic-bezier para efeito "elástico"
- **Saída:** Fade-out + scale down

### Ícone
- **Entrada:** Bounce (escala 0 → 1.1 → 1) em 0.5s

---

## 📱 Responsividade

### Desktop (> 768px)
- Padding: 32px
- Ícone: 48px
- Título: 24px
- Botões lado a lado

### Mobile (≤ 768px)
- Padding: 24px
- Ícone: 36px
- Título: 20px
- Botões empilhados verticalmente (100% largura)

---

## ⌨️ Acessibilidade

### Teclado
- **Tab:** Navega entre botões
- **Enter:** Confirma (quando botão está focado)
- **Esc:** Cancela (clique no overlay)

### Foco
- Cancelar recebe foco automaticamente (segurança)
- Outline personalizado nos botões (anel azul/cinza)

---

## 🔧 Integração

### HTML
```html
<link rel="stylesheet" href="flash-message.css">
<script src="flash-message.js"></script>
```

### CSS Necessário
- Todos os estilos estão em `flash-message.css`
- Classes: `.confirm-modal`, `.confirm-dialog`, `.confirm-warning`, etc.

### JavaScript Necessário
- Classe `ConfirmModal` em `flash-message.js`
- Instância global: `confirmModal`
- Atalhos: `showConfirm`, `confirmWarning`, `confirmDanger`, `confirmInfo`

---

## 🚫 Substituições Realizadas

Todos os `confirm()` nativos foram substituídos:

| Localização | Antes | Depois |
|-------------|-------|--------|
| admin.html:617 | `confirm('Promover...')` | `showConfirm(...)` |
| admin.html:640 | `confirm('Rebaixar...')` | `confirmWarning(...)` |
| admin.html:751 | `confirm('Fechar apostas?')` | `confirmWarning(...)` |
| admin.html:778 | `confirm('Confirmar vencedor?')` | `showConfirm(...)` |
| admin.html:852 | `confirm('Reset total?')` | `confirmDanger(...)` |

---

## 🎯 Boas Práticas

### 1. Use HTML na Mensagem
```javascript
// ✅ BOM
await showConfirm('Deseja deletar <strong>10 itens</strong>?');

// ❌ EVITE
await showConfirm('Deseja deletar 10 itens?');
```

### 2. Quebre Linhas com `<br>`
```javascript
// ✅ BOM
await showConfirm('Linha 1<br><br>Linha 2');

// ❌ EVITE
await showConfirm('Linha 1\n\nLinha 2'); // \n não funciona
```

### 3. Escolha o Tipo Correto
```javascript
// ✅ BOM - Danger para ações destrutivas
await confirmDanger('Deletar tudo?');

// ❌ EVITE - Success não faz sentido para deletar
await showConfirm('Deletar tudo?', { type: 'success' });
```

### 4. Botões Descritivos
```javascript
// ✅ BOM
confirmText: 'Sim, Resetar Tudo'

// ❌ EVITE
confirmText: 'OK'
```

---

## 🐛 Troubleshooting

### Modal não aparece
- ✅ Verificar se `flash-message.js` está carregado
- ✅ Console (F12): procurar erros JavaScript
- ✅ Verificar se CSS está carregado

### Botões não funcionam
- ✅ Verificar event listeners no console
- ✅ Testar com `console.log()` dentro da função

### Animação travada
- ✅ Limpar cache do navegador (Ctrl+Shift+Del)
- ✅ Verificar performance (F12 → Performance)

---

## 📊 Comparação: Antes vs Depois

### Antes (window.confirm)
```javascript
if (!confirm('Deseja continuar?')) return;
```

**Problemas:**
- ❌ Aparência nativa do SO (feia)
- ❌ Bloqueante (trava página)
- ❌ Sem customização
- ❌ Sem HTML suportado
- ❌ Sem animações

### Depois (Modal Personalizado)
```javascript
const confirmado = await showConfirm('Deseja continuar?');
if (!confirmado) return;
```

**Vantagens:**
- ✅ Design moderno e consistente
- ✅ Assíncrono (Promise-based)
- ✅ Totalmente customizável
- ✅ Suporte a HTML
- ✅ Animações suaves
- ✅ 4 tipos visuais
- ✅ Responsivo

---

## 🎉 Resultado Final

- ✅ **100% dos confirms substituídos** (5 ocorrências)
- ✅ **UX moderna e consistente** com o sistema
- ✅ **Código assíncrono** (async/await)
- ✅ **Animações profissionais** (fade, slide, bounce)
- ✅ **Totalmente responsivo** (desktop e mobile)
- ✅ **Acessível** (teclado, foco)

---

## 📞 Suporte

Para dúvidas:
1. Verificar [SEGURANCA-UX.md](SEGURANCA-UX.md) para Flash Messages
2. Console do navegador (F12) para debug
3. Testar com `console.log()` nos callbacks

---

**Versão:** 1.0  
**Data:** 14/01/2026  
**Desenvolvedor:** GitHub Copilot (Claude Sonnet 4.5)
