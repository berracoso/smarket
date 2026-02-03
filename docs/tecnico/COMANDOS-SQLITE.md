# 🗄️ Comandos Úteis - SQLite

## Ver Estrutura do Banco de Dados

### Usando SQLite CLI (se instalado):
```bash
# Abrir banco
sqlite3 bolao.db

# Listar tabelas
.tables

# Ver estrutura de uma tabela
.schema usuarios
.schema apostas
.schema evento

# Consultar dados
SELECT * FROM usuarios;
SELECT * FROM apostas;
SELECT * FROM evento;

# Sair
.exit
```

## Consultas SQL Úteis

### Ver todos os usuários:
```sql
SELECT id, nome, email, 
       CASE WHEN isSuperAdmin = 1 THEN 'Super Admin'
            WHEN isAdmin = 1 THEN 'Admin'
            ELSE 'Usuario' END as tipo_usuario
FROM usuarios;
```

### Ver apostas por usuário:
```sql
SELECT u.nome, a.time, a.valor, a.timestamp
FROM apostas a
JOIN usuarios u ON a.userId = u.id
ORDER BY a.timestamp DESC;
```

### Total apostado por time:
```sql
SELECT time, 
       COUNT(*) as total_apostas,
       SUM(valor) as total_valor
FROM apostas
GROUP BY time;
```

### Ver histórico de um usuário específico:
```sql
SELECT a.*, u.email
FROM apostas a
JOIN usuarios u ON a.userId = u.id
WHERE u.email = 'seu-email@exemplo.com';
```

## Backup e Restauração

### Backup manual:
```bash
# PowerShell
Copy-Item bolao.db bolao-backup-$(Get-Date -Format 'yyyy-MM-dd').db

# Ou simplesmente
Copy-Item bolao.db bolao-backup.db
```

### Restaurar backup:
```bash
# PowerShell
Copy-Item bolao-backup.db bolao.db -Force
```

### Exportar dados para SQL:
```bash
# Usando SQLite CLI
sqlite3 bolao.db .dump > backup.sql
```

### Importar dados de SQL:
```bash
# Usando SQLite CLI
sqlite3 bolao-novo.db < backup.sql
```

## Manutenção

### Ver tamanho do banco:
```bash
# PowerShell
Get-Item bolao.db | Select-Object Name, Length
```

### Otimizar banco (reduzir tamanho):
```bash
sqlite3 bolao.db "VACUUM;"
```

### Ver número de registros:
```sql
SELECT 
    (SELECT COUNT(*) FROM usuarios) as total_usuarios,
    (SELECT COUNT(*) FROM apostas) as total_apostas;
```

## Operações Administrativas via SQL

### Alterar senha de um usuário:
```sql
-- Você precisa gerar um hash bcrypt primeiro (use o Node.js)
-- Exemplo com hash já gerado:
UPDATE usuarios 
SET senha = '$2a$10$seu-hash-bcrypt-aqui'
WHERE email = 'usuario@email.com';
```

### Promover usuário manualmente:
```sql
UPDATE usuarios 
SET isAdmin = 1, tipo = 'admin'
WHERE email = 'usuario@email.com';
```

### Rebaixar usuário:
```sql
UPDATE usuarios 
SET isAdmin = 0, tipo = 'usuario'
WHERE email = 'usuario@email.com';
```

### Deletar todas as apostas (manter usuários):
```sql
DELETE FROM apostas;
```

### Novo evento:
```sql
UPDATE evento 
SET aberto = 1, vencedor = NULL
WHERE id = 'evento-1';
```

## Gerar Hash Bcrypt (Node.js)

Para alterar senha manualmente, use este script:
```javascript
// salve como gerar-senha.js
const bcrypt = require('bcryptjs');
const senha = 'sua-nova-senha';
const hash = bcrypt.hashSync(senha, 10);
console.log('Hash:', hash);
```

Execute:
```bash
node gerar-senha.js
```

## Logs e Debug

### Ver últimas apostas:
```sql
SELECT u.nome, a.time, a.valor, a.timestamp
FROM apostas a
JOIN usuarios u ON a.userId = u.id
ORDER BY a.timestamp DESC
LIMIT 10;
```

### Ver usuários criados recentemente:
```sql
SELECT nome, email, tipo, criadoEm
FROM usuarios
ORDER BY criadoEm DESC
LIMIT 10;
```

### Verificar integridade:
```sql
-- Apostas sem usuário (órfãs)
SELECT * FROM apostas
WHERE userId NOT IN (SELECT id FROM usuarios);
```

## Segurança

⚠️ **Importante:**
- Nunca compartilhe o arquivo `bolao.db` publicamente
- Faça backups regulares
- Use senhas fortes
- O `bolao.db` já está no `.gitignore`

## Reiniciar do Zero

Para começar com banco limpo:
```bash
# PowerShell - CUIDADO: apaga todos os dados!
Remove-Item bolao.db
npm start
```

O servidor criará automaticamente:
- ✅ Novo banco vazio
- ✅ Todas as tabelas
- ✅ Super Admin padrão (admin@bolao.com)
- ✅ Evento padrão
