# Testes do Bolão Privado

Esta pasta contém testes unitários e funcionais que cobrem todas as funcionalidades do sistema.

## 📦 Instalação

Instale as dependências de teste:

```bash
npm install
```

## 🧪 Executar Testes

### Todos os testes com cobertura
```bash
npm test
```

### Modo watch (desenvolvimento)
```bash
npm run test:watch
```

### Apenas testes unitários
```bash
npm run test:unit
```

### Apenas testes de integração
```bash
npm run test:integration
```

## 📊 Cobertura de Testes

Os testes cobrem:

### 1. **auth.test.js** - Autenticação
- ✅ Registro de novos usuários
- ✅ Validação de campos obrigatórios
- ✅ Senha mínima de 6 caracteres
- ✅ Email único (sem duplicatas)
- ✅ Login com credenciais válidas
- ✅ Rejeição de credenciais inválidas
- ✅ Logout e destruição de sessão

### 2. **apostas.test.js** - Apostas
- ✅ Criar apostas válidas
- ✅ Validação de campos obrigatórios
- ✅ Validação de valor positivo
- ✅ Super Admin não pode apostar
- ✅ Listar apostas do usuário
- ✅ Filtrar apostas por evento ativo
- ✅ Cálculo de valor total

### 3. **eventos.test.js** - Eventos e Reset
- ✅ Criar novo evento com status ativo
- ✅ Criar eventos com códigos únicos
- ✅ Finalizar evento (status = 'finalizado')
- ✅ Arquivar evento antigo em reset
- ✅ Criar novo evento em reset
- ✅ Preservar histórico de apostas
- ✅ Manter múltiplos eventos no histórico
- ✅ Buscar apenas evento ativo

### 4. **historico.test.js** - Histórico e Paginação
- ✅ Retornar todas apostas do usuário
- ✅ Incluir nome do evento nas apostas
- ✅ Filtrar por evento específico
- ✅ Filtrar por período de datas
- ✅ Combinar filtros (evento + data)
- ✅ Paginação com limite de 5 itens
- ✅ Navegação entre páginas
- ✅ Cálculo de total de páginas
- ✅ Estatísticas: total apostado
- ✅ Estatísticas: total de apostas
- ✅ Estatísticas: apostas ganhas
- ✅ Estatísticas: taxa de acerto
- ✅ Estatísticas: eventos participados

### 5. **permissoes.test.js** - Permissões e RBAC
- ✅ Validação de tipos de usuário
- ✅ Super Admin com ambas flags ativas
- ✅ Admin com apenas isAdmin ativa
- ✅ Usuário comum sem flags
- ✅ Promover usuário a admin
- ✅ Rebaixar admin a usuário
- ✅ Proteção contra rebaixamento de Super Admin
- ✅ Validação de apostas por tipo
- ✅ Permissões de rotas admin
- ✅ Permissões de rotas super admin
- ✅ Email único
- ✅ Contagem de usuários por tipo

### 6. **calculos.test.js** - Cálculos Financeiros
- ✅ Cálculo de retorno estimado
- ✅ Retorno com múltiplas apostas
- ✅ Cálculo de lucro
- ✅ Time perdedor não recebe
- ✅ Taxa da plataforma (5%)
- ✅ Total do prêmio (95%)
- ✅ Distribuição proporcional
- ✅ Winner takes all
- ✅ Lucro negativo em casos extremos
- ✅ Casos extremos (R$ 1, todos no mesmo time)
- ✅ Validação de divisão por zero
- ✅ Múltiplos times
- ✅ Arredondamento de valores decimais

## 📁 Estrutura dos Testes

```
tests/
├── setup.js              # Configuração global
├── auth.test.js          # 10 testes de autenticação
├── apostas.test.js       # 8 testes de apostas
├── eventos.test.js       # 9 testes de eventos
├── historico.test.js     # 14 testes de histórico
├── permissoes.test.js    # 12 testes de permissões
└── calculos.test.js      # 20 testes de cálculos
```

**Total: 73 testes** cobrindo todas as funcionalidades críticas do sistema.

## 🎯 Metas de Cobertura

- **Linhas:** > 80%
- **Funções:** > 80%
- **Branches:** > 75%
- **Statements:** > 80%

## 🔍 Banco de Dados de Teste

Os testes utilizam SQLite em memória (`:memory:`), garantindo:
- ✅ Isolamento total entre testes
- ✅ Velocidade máxima de execução
- ✅ Sem poluição do banco de dados real
- ✅ Cleanup automático após cada teste

## 🚀 Integração Contínua

Estes testes podem ser executados em pipelines de CI/CD:

```yaml
# Exemplo para GitHub Actions
- name: Run tests
  run: npm test
  
- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## 📝 Adicionar Novos Testes

Para adicionar novos testes:

1. Crie um arquivo `nome.test.js` na pasta `tests/`
2. Siga o padrão dos testes existentes
3. Use `describe()` para agrupar testes relacionados
4. Use `test()` ou `it()` para cada caso de teste
5. Use `beforeEach()` e `afterEach()` para setup/cleanup

Exemplo:

```javascript
describe('Nova Funcionalidade', () => {
    let db;

    beforeEach(() => {
        // Setup
    });

    afterEach(() => {
        // Cleanup
    });

    test('Deve fazer algo específico', () => {
        // Arrange
        // Act
        // Assert
        expect(resultado).toBe(esperado);
    });
});
```

## 🐛 Debugging

Para debugar um teste específico:

```bash
# Executar apenas um arquivo
npx jest tests/auth.test.js

# Executar apenas um teste específico
npx jest -t "Deve registrar novo usuário"

# Modo verbose com detalhes
npx jest --verbose

# Ver cobertura detalhada
npx jest --coverage --verbose
```

## 📊 Relatório de Cobertura

Após executar `npm test`, o relatório de cobertura estará disponível em:

```
coverage/
├── lcov-report/
│   └── index.html    # Abra este arquivo no navegador
└── lcov.info         # Formato para CI/CD
```

## ✅ Checklist de Qualidade

Antes de fazer commit, certifique-se:

- [ ] Todos os testes passam (`npm test`)
- [ ] Cobertura está acima de 80%
- [ ] Não há testes ignorados (`test.skip` ou `describe.skip`)
- [ ] Novos recursos têm testes correspondentes
- [ ] Testes são independentes (não dependem de ordem)
- [ ] Não há logs de console nos testes
