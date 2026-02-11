# 🎯 Bolão Privado - Mini Polymarket

Sistema de apostas privado entre amigos com probabilidades dinâmicas e **persistência em SQLite**.

---

## 📚 DOCUMENTAÇÃO DE DEPLOY

### 🚀 **Guias de Deploy (LEIA ANTES DE SUBIR EM PRODUÇÃO)**

| Documento | O que é | Quando usar |
|-----------|---------|-------------|
| 📖 **[DEPLOY-VISUAL.md](./DEPLOY-VISUAL.md)** | Guia visual em 3 passos | ⭐ **COMECE AQUI** - Visão geral |
| ❓ **[DEPLOY-FAQ.md](./DEPLOY-FAQ.md)** | Respostas diretas às dúvidas | Tem dúvidas específicas? |
| 📋 **[DEPLOY-GUIA-COMPLETO.md](./DEPLOY-GUIA-COMPLETO.md)** | Passo a passo detalhado | Referência completa |
| ✅ **[PRE-DEPLOYMENT.md](./PRE-DEPLOYMENT.md)** | Checklist antes do deploy | Verificar se está pronto |
| 🔒 **[DEPLOYMENT.md](./DEPLOYMENT.md)** | Configurações técnicas | Referência avançada |

**💡 Ordem recomendada:**
1. DEPLOY-VISUAL.md (visão geral)
2. DEPLOY-FAQ.md (esclarecer dúvidas)
3. DEPLOY-GUIA-COMPLETO.md (executar deploy)

---

## ⚡ NOVIDADE: Banco de Dados SQLite

**Agora os dados são salvos permanentemente!** Você não precisa mais recriar perfis toda vez que reinicia o servidor.

- 💾 **Dados persistentes** em `bolao.db`
- 👥 **Usuários mantidos** entre reinicializações
- 📊 **Histórico de apostas** preservado
- 🔄 **Backup fácil** - basta copiar o arquivo do banco

Veja [README-SQLITE.md](./docs/tecnico/README-SQLITE.md) para documentação completa do banco de dados.

## 🔐 CREDENCIAIS DE ACESSO

### Super Administrador (criado automaticamente)
Credenciais configuradas no arquivo `.env`:
- `ADMIN_EMAIL` - Email do administrador
- `ADMIN_PASSWORD` - Senha do administrador

Configure o `.env` antes de executar `npm run setup`.

### Usuários Comuns
Podem se registrar gratuitamente na página de login.

---

## 🔐 Segurança da Aplicação

A aplicação foi desenvolvida com boas práticas de segurança:

- ✅ **Autenticação segura** com bcryptjs (senha hasheada)
- ✅ **Sessões com httpOnly cookies** (protege contra XSS)
- ✅ **CORS restringido** apenas a domínios autorizados
- ✅ **Rate limiting** contra força bruta (5 tentativas em 15 min)
- ✅ **Proteção CSRF** com SameSite=strict
- ✅ **Headers de segurança** HTTP (Helmet)
- ✅ **Validação em todas as rotas** contra SQL injection
- ✅ **Variáveis de ambiente** para secrets (nunca hardcoded)
- ✅ **Clean Architecture** para código seguro e testável
- ✅ **251 testes** garantem qualidade do código

### Para Publicar em Produção
Veja o arquivo [DEPLOYMENT.md](./DEPLOYMENT.md) para checklist completo de segurança e opções de hospedagem.

## 📋 Sobre o Projeto

Este é um MVP (Produto Mínimo Viável) de um sistema de apostas privado para torneios com 4 times, com:

- ✅ **Banco de dados SQLite** com persistência
- ✅ **Sistema de autenticação** (login/registro)
- ✅ **Sessões de usuário** individuais
- ✅ **Menu lateral** com navegação intuitiva
- ✅ **Painel administrativo** protegido
- ✅ **Taxa de 5%** sobre o prêmio total
- ✅ **RBAC** - 3 níveis hierárquicos (Super Admin, Admin, Usuário)
- ✅ **Probabilidades dinâmicas** baseadas no volume
- ✅ **Cálculo automático** de retorno estimado
- ✅ **Interface moderna** e responsiva

## 🚀 Funcionalidades

### Para Usuários (Apostadores)
- 📝 Registrar conta com email e senha (dados salvos no banco)
- 🔐 Login seguro com sessão persistente
- 🎯 Fazer apostas escolhendo time e valor
- 💰 Ver retorno estimado (já com 5% de taxa descontada)
- 📊 Visualizar probabilidades em tempo real
- 📋 Acompanhar histórico de apostas pessoais
- 👤 Ver dados da conta e permissões
- 🚪 Logout

### Para Administradores
- ⚙️ Acesso exclusivo ao painel admin
- 🔓 Abrir/fechar apostas
- 👥 Visualizar e gerenciar usuários
- 🏆 Definir time vencedor
- 💵 Calcular ganhos dos vencedores (com 5% de taxa)
- 📈 Ver receita da plataforma
- 🔄 Novo evento (limpar apostas)
- 💾 Visualizar banco de dados completo
- 👑 Promover usuários a Admin (apenas Super Admin pode rebaixar)

## 🛠️ Tecnologias Utilizadas

- **Backend**: Node.js + Express
- **Frontend**: HTML5, CSS3, JavaScript puro
- **Armazenamento**: Em memória (variáveis)
- **API**: RESTful

## 📦 Instalação e Execução

### Pré-requisitos
- Node.js versão 14 ou superior
- npm (geralmente vem com Node.js)

### Passos

1. Clone ou baixe este repositório

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor:
```bash
npm start
# ou
npm run dev
```

4. Aguarde o servidor iniciar (você verá):
```
✅ Conectado ao banco SQLite
🚀 ========================================
🚀 Servidor Bolão Privado - Clean Architecture
🚀 ========================================
🚀 Porta: 3000
🚀 Container DI: 33 dependências
🚀 ========================================
```

5. Acesse no navegador:
- **Página principal**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **Painel admin**: http://localhost:3000/admin
- **Health check**: http://localhost:3000/health

### ⚠️ Solução de Problemas

**Porta 3000 já em uso?**
```bash
# Windows PowerShell
Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }
```

**Erro ao conectar ao banco?**
```bash
# Remova o banco e reinicie
rm bolao.db
npm start
```

Veja mais detalhes em: [COMO-INICIAR.md](./docs/tecnico/COMO-INICIAR.md)

## 📱 Como Usar

### Para os Apostadores

1. Acesse o link compartilhado (ex: http://localhost:3000)
2. Digite seu nome
3. Escolha o time que deseja apostar
4. Digite o valor da aposta
5. Veja o retorno estimado
6. Confirme a aposta

### Para o Organizador

1. Acesse o painel administrativo: http://localhost:3000/admin
2. Compartilhe o link principal com os amigos
3. Acompanhe as apostas em tempo real
4. Quando quiser parar de receber apostas, clique em "Fechar Apostas"
5. Após o evento terminar, defina o time vencedor
6. O sistema calculará automaticamente os ganhos de cada vencedor

## 🔄 Fluxo de Uso

```
1. Organizador abre o evento (apostas abertas por padrão)
2. Compartilha link no WhatsApp
3. Amigos fazem apostas
4. Probabilidades se atualizam automaticamente
5. Organizador fecha apostas
6. Evento acontece
7. Organizador define vencedor
8. Sistema calcula ganhos
```

## 📊 API Endpoints

### POST /apostas
Criar nova aposta
```json
{
  "nome": "João",
  "time": "Time A",
  "valor": 50
}
```

### GET /resumo
Obter resumo do mercado (probabilidades, totais, etc)

### GET /apostas
Listar todas as apostas registradas

### POST /fechar
Fechar apostas (não aceita mais apostas)

### POST /abrir
Reabrir apostas

### POST /vencedor
Definir time vencedor e calcular ganhos
```json
{
  "time": "Time A"
}
```

### POST /reset
Novo evento (limpar todas as apostas)

## 💡 Modelo de Aposta

### Cálculo de Probabilidade
```
Probabilidade(Time X) = Total apostado no Time X / Total apostado geral
```

### Cálculo de Retorno
```
Retorno = (Valor da aposta / Total apostado no Time escolhido) * Total geral
```

### Exemplo Prático
- **Total geral**: R$ 200
- **Time A**: R$ 100 (50% de probabilidade)
- **Time B**: R$ 50 (25% de probabilidade)
- **Time C**: R$ 30 (15% de probabilidade)
- **Time D**: R$ 20 (10% de probabilidade)

Se você apostar R$ 50 no Time A:
- **Retorno estimado**: (50 / 150) × 250 = R$ 83,33
- **Lucro**: R$ 33,33

## 🎨 Características do Design

- Interface moderna e intuitiva
- Responsivo (funciona em mobile)
- Cores e gradientes atrativos
- Atualização automática dos dados
- Feedback visual para todas as ações

## ⚠️ Importante

### Pagamento
Este MVP **não inclui pagamento automático**. Os pagamentos devem ser feitos manualmente entre os participantes ou usar "dinheiro fictício" para teste.

Motivos:
- Evita problemas legais
- Evita integração complexa
- Permite validar a ideia rapidamente
- Ideal para uso entre amigos

### Dados
Os dados são armazenados **em memória**. Ao reiniciar o servidor, todos os dados serão perdidos.

Para uso em produção, considere:
- Adicionar banco de dados (MongoDB, PostgreSQL, etc)
- Implementar autenticação
- Adicionar histórico de eventos
- Implementar pagamento via Pix

## 🚀 Próximas Evoluções

- [ ] Banco de dados persistente
- [ ] Múltiplos eventos simultâneos
- [ ] Histórico de eventos passados
- [ ] Autenticação de usuários
- [ ] Integração com Pix
- [ ] Bot de WhatsApp
- [ ] Taxa automática do organizador
- [ ] Deploy em servidor público
- [ ] PWA (Progressive Web App)

## 📄 Estrutura do Projeto

```
bolao-privado/
├── docs/               # Documentação do projeto
├── server.js           # Servidor Node.js + API
├── package.json        # Dependências
├── README.md          # Esta documentação
└── public/
    ├── index.html     # Página de apostas
    └── admin.html     # Painel administrativo
```

## 🐛 Solução de Problemas

### Porta já em uso
Se a porta 3000 estiver em uso, você pode mudá-la:
```bash
PORT=3001 npm start
```

### Erro ao instalar dependências
Certifique-se de ter Node.js instalado:
```bash
node --version
npm --version
```

### Página não carrega
Verifique se o servidor está rodando e acesse o endereço correto.

## 📞 Suporte

Para dúvidas ou sugestões, abra uma issue no repositório.

## 📝 Licença

MIT - Sinta-se livre para usar e modificar este projeto.

---

**Desenvolvido com ❤️ para validar ideias entre amigos**
