/**
 * Configuração Global dos Testes
 * Define timeout e configurações compartilhadas
 */

// Aumentar timeout para testes de banco de dados
jest.setTimeout(10000);

// Mock do console para testes mais limpos
global.console = {
    ...console,
    log: jest.fn(), // Silenciar logs durante testes
    error: jest.fn(),
    warn: jest.fn(),
};

// Variáveis globais de teste
global.testDbPath = ':memory:'; // Usar banco em memória para testes
