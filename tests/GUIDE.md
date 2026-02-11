# Guia para Adicionar Novos Testes

Este guia mostra exemplos práticos de como adicionar testes ao sistema.

## 📋 Template Básico

```javascript
/**
 * Testes de [Nome da Funcionalidade]
 * Cobre: [lista de casos]
 */

const sqlite3 = require('sqlite3').verbose();

describe('[Nome da Funcionalidade]', () => {
    let db;
    let userId;

    beforeEach((done) => {
        // Setup do banco de dados em memória
        db = new sqlite3.Database(':memory:', (err) => {
            if (err) return done(err);

            // Criar tabelas necessárias
            db.run(`CREATE TABLE usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL
            )`, () => {
                // Inserir dados de teste
                db.run('INSERT INTO usuarios (nome) VALUES (?)', ['Test User'], function() {
                    userId = this.lastID;
                    done();
                });
            });
        });
    });

    afterEach((done) => {
        // Cleanup - fechar banco
        db.close(done);
    });

    describe('Caso de Teste 1', () => {
        test('Deve fazer algo específico', (done) => {
            // Arrange (preparar)
            const esperado = 'valor esperado';

            // Act (executar)
            db.get('SELECT * FROM usuarios WHERE id = ?', [userId], (err, result) => {
                // Assert (verificar)
                expect(result.nome).toBe('Test User');
                done();
            });
        });
    });
});
```

## 🔍 Exemplos Práticos

### 1. Teste de API com Supertest

```javascript
const request = require('supertest');
const express = require('express');

describe('API de Usuários', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        
        app.get('/usuarios', (req, res) => {
            res.json({ usuarios: [], total: 0 });
        });
    });

    test('Deve retornar lista vazia', async () => {
        const response = await request(app)
            .get('/usuarios')
            .expect(200);

        expect(response.body.total).toBe(0);
    });
});
```

### 2. Teste com Sessão

```javascript
const session = require('express-session');

beforeEach(() => {
    app.use(session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false
    }));
});

test('Deve manter sessão do usuário', async () => {
    const agent = request.agent(app);

    // Fazer login
    await agent
        .post('/auth/login')
        .send({ email: 'test@test.com', senha: '123456' });

    // Acessar rota protegida
    const response = await agent
        .get('/perfil')
        .expect(200);

    expect(response.body.usuario).toBeDefined();
});
```

### 3. Teste de Validação

```javascript
describe('Validações de Aposta', () => {
    test('Deve rejeitar valor negativo', async () => {
        const response = await request(app)
            .post('/apostas')
            .send({ time: 'Time A', valor: -100 });

        expect(response.status).toBe(400);
        expect(response.body.erro).toContain('maior que zero');
    });

    test('Deve aceitar valor válido', async () => {
        const response = await request(app)
            .post('/apostas')
            .send({ time: 'Time A', valor: 100 });

        expect(response.status).toBe(200);
        expect(response.body.sucesso).toBe(true);
    });
});
```

### 4. Teste de Cálculos

```javascript
describe('Cálculo de Lucro', () => {
    test('Deve calcular lucro corretamente', () => {
        const apostado = 100;
        const retorno = 150;
        const lucro = retorno - apostado;

        expect(lucro).toBe(50);
    });

    test('Deve tratar lucro negativo', () => {
        const apostado = 200;
        const retorno = 150;
        const lucro = retorno - apostado;

        expect(lucro).toBe(-50);
    });
});
```

### 5. Teste Assíncrono com async/await

```javascript
test('Deve criar usuário assincronamente', async () => {
    const resultado = await new Promise((resolve, reject) => {
        db.run('INSERT INTO usuarios (nome) VALUES (?)', ['Novo User'], function(err) {
            if (err) return reject(err);
            resolve(this.lastID);
        });
    });

    expect(resultado).toBeGreaterThan(0);
});
```

### 6. Teste com Mock

```javascript
test('Deve chamar callback correto', () => {
    const mockCallback = jest.fn();
    
    function processarDados(dados, callback) {
        callback(dados.length);
    }

    processarDados([1, 2, 3], mockCallback);

    expect(mockCallback).toHaveBeenCalledWith(3);
    expect(mockCallback).toHaveBeenCalledTimes(1);
});
```

### 7. Teste de Erro

```javascript
test('Deve lançar erro para input inválido', () => {
    function dividir(a, b) {
        if (b === 0) throw new Error('Divisão por zero');
        return a / b;
    }

    expect(() => dividir(10, 0)).toThrow('Divisão por zero');
    expect(() => dividir(10, 2)).not.toThrow();
});
```

### 8. Teste de Query Complexa

```javascript
test('Deve filtrar por múltiplos critérios', (done) => {
    const query = `
        SELECT a.*, u.nome 
        FROM apostas a 
        JOIN usuarios u ON a.userId = u.id 
        WHERE a.valor > ? AND a.time = ?
    `;

    db.all(query, [50, 'Time A'], (err, apostas) => {
        expect(apostas).toHaveLength(2);
        apostas.forEach(a => {
            expect(a.valor).toBeGreaterThan(50);
            expect(a.time).toBe('Time A');
        });
        done();
    });
});
```

### 9. Teste de Paginação

```javascript
test('Deve retornar página correta', (done) => {
    const limite = 5;
    const pagina = 2;
    const offset = (pagina - 1) * limite;

    db.all('SELECT * FROM apostas LIMIT ? OFFSET ?', [limite, offset], (err, apostas) => {
        expect(apostas).toHaveLength(5);
        // Verificar que são registros diferentes da página 1
        expect(apostas[0].id).toBeGreaterThan(5);
        done();
    });
});
```

### 10. Teste de Integração Completo

```javascript
describe('Fluxo Completo de Aposta', () => {
    test('Deve criar aposta e aparecer no histórico', async () => {
        const agent = request.agent(app);

        // 1. Registrar usuário
        await agent
            .post('/auth/registro')
            .send({ nome: 'Test', email: 'test@test.com', senha: '123456' });

        // 2. Criar aposta
        const apostaResponse = await agent
            .post('/apostas')
            .send({ time: 'Time A', valor: 100 });

        expect(apostaResponse.body.sucesso).toBe(true);
        const apostaId = apostaResponse.body.aposta.id;

        // 3. Verificar em minhas apostas
        const minhasApostasResponse = await agent.get('/minhas-apostas');
        
        const apostaEncontrada = minhasApostasResponse.body.apostas
            .find(a => a.id === apostaId);

        expect(apostaEncontrada).toBeDefined();
        expect(apostaEncontrada.valor).toBe(100);
    });
});
```

## 🎯 Matchers Úteis do Jest

```javascript
// Igualdade
expect(valor).toBe(5);                    // Igualdade estrita
expect(obj).toEqual({ nome: 'Test' });    // Igualdade profunda

// Números
expect(valor).toBeGreaterThan(10);
expect(valor).toBeLessThan(100);
expect(valor).toBeCloseTo(142.5, 1);      // Com precisão decimal

// Strings
expect(texto).toContain('substring');
expect(texto).toMatch(/regex/);

// Arrays
expect(array).toHaveLength(3);
expect(array).toContain('item');

// Booleanos
expect(condicao).toBeTruthy();
expect(condicao).toBeFalsy();

// Null/Undefined
expect(valor).toBeDefined();
expect(valor).toBeNull();
expect(valor).toBeUndefined();

// Exceptions
expect(() => funcao()).toThrow();
expect(() => funcao()).toThrow('mensagem');

// Async
await expect(promessa).resolves.toBe(valor);
await expect(promessa).rejects.toThrow();
```

## 📝 Boas Práticas

### 1. Nome Descritivo
```javascript
// ❌ Ruim
test('teste 1', () => {});

// ✅ Bom
test('Deve rejeitar aposta com valor negativo', () => {});
```

### 2. Arrange-Act-Assert
```javascript
test('Deve calcular total corretamente', () => {
    // Arrange
    const valores = [100, 200, 300];
    
    // Act
    const total = valores.reduce((sum, v) => sum + v, 0);
    
    // Assert
    expect(total).toBe(600);
});
```

### 3. Isolamento de Testes
```javascript
// ❌ Ruim - testes dependentes
let contador = 0;
test('incrementa', () => { contador++; });
test('verifica', () => { expect(contador).toBe(1); });

// ✅ Bom - testes independentes
test('incrementa a partir de zero', () => {
    let contador = 0;
    contador++;
    expect(contador).toBe(1);
});
```

### 4. Setup e Teardown
```javascript
beforeAll(() => {
    // Executado uma vez antes de todos os testes
});

beforeEach(() => {
    // Executado antes de cada teste
});

afterEach(() => {
    // Executado depois de cada teste
});

afterAll(() => {
    // Executado uma vez depois de todos os testes
});
```

### 5. Teste de Casos Extremos
```javascript
describe('Validação de Input', () => {
    test('valor mínimo', () => {});
    test('valor máximo', () => {});
    test('valor zero', () => {});
    test('valor negativo', () => {});
    test('valor null', () => {});
    test('valor undefined', () => {});
    test('string vazia', () => {});
});
```

## 🚀 Executar Testes

```bash
# Todos os testes
npm test

# Modo watch
npm run test:watch

# Arquivo específico
npm test -- auth.test.js

# Teste específico
npm test -- -t "Deve registrar novo usuário"

# Com debug
npm test -- --detectOpenHandles
```

## 📊 Verificar Cobertura

Após executar `npm test`, abra:
```
coverage/lcov-report/index.html
```

Meta: Manter cobertura acima de 80% em todas as métricas.
