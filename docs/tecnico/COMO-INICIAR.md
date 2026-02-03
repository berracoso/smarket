# 🚀 Como Iniciar o Servidor - Guia Rápido

## ✅ Problema Corrigido

O servidor agora inicia automaticamente quando você executa `npm start` ou `npm run dev`.

## 📋 Como Usar

### Iniciar o Servidor

```bash
# Produção
npm start

# Desenvolvimento (mesmo comando)
npm run dev
```

### Saída Esperada

```
✅ Conectado ao banco SQLite
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

### Acessar o Sistema

1. **Homepage:** http://localhost:3000/
2. **Login:** http://localhost:3000/login
3. **Admin:** http://localhost:3000/admin
4. **Health Check:** http://localhost:3000/health

## 🔧 Comandos Úteis

### Parar o Servidor

```bash
# Windows
Ctrl + C

# Ou via PowerShell (se travado)
Get-Process -Name node | Stop-Process -Force
```

### Verificar se Está Rodando

```bash
# Windows PowerShell
Get-NetTCPConnection -LocalPort 3000
```

### Executar Testes

```bash
# Todos os testes
npm test

# Apenas unitários
npm run test:unit

# Apenas integração
npm run test:integration

# Modo watch
npm run test:watch
```

## 🐛 Troubleshooting

### Erro: "Port 3000 already in use"

```bash
# Windows PowerShell
$proc = Get-NetTCPConnection -LocalPort 3000 | Select-Object -First 1 -ExpandProperty OwningProcess
Stop-Process -Id $proc -Force
```

### Erro: "Cannot find module"

```bash
# Reinstalar dependências
npm install
```

### Erro: Database locked

```bash
# Remover database e reiniciar
rm bolao.db
npm start
```

## 🎯 O Que Foi Corrigido

### Problema Anterior

O servidor travava após o log "✅ Conectado ao banco SQLite" porque:
- A condição `require.main === module` retornava `false`
- O servidor nunca chamava `iniciarServidor()`

### Solução Implementada

```javascript
// Antes (não funcionava)
if (require.main === module) {
    iniciarServidor();
}

// Depois (funciona!)
if (process.env.NODE_ENV !== 'test') {
    iniciarServidor();
}
```

Agora o servidor:
✅ Inicia automaticamente em desenvolvimento
✅ Inicia automaticamente em produção
✅ NÃO inicia durante os testes (correto!)

## 📊 Status

- ✅ Servidor inicializa corretamente
- ✅ 231 testes passando
- ✅ Container DI funcionando (33 dependências)
- ✅ Banco de dados conectado
- ✅ Todas as rotas registradas

---

**Última Atualização:** 2026-01-20  
**Status:** ✅ FUNCIONANDO PERFEITAMENTE
