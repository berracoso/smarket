#!/usr/bin/env node

/**
 * Script de Execução de Testes
 * Facilita a execução de testes com diferentes configurações
 */

const { spawn } = require('child_process');
const args = process.argv.slice(2);

const commands = {
    all: ['jest', '--coverage', '--verbose'],
    watch: ['jest', '--watch'],
    unit: ['jest', 'tests/unit', '--coverage'],
    integration: ['jest', 'tests/integration', '--coverage'],
    quick: ['jest', '--no-coverage'],
    debug: ['jest', '--detectOpenHandles', '--verbose'],
    single: ['jest', '--testNamePattern'],
    file: ['jest'],
};

function printHelp() {
    console.log(`
📋 Script de Testes - Bolão Privado

Uso: node tests/run-tests.js [comando] [opções]

Comandos disponíveis:

  all           Executa todos os testes com cobertura (padrão)
  watch         Modo watch para desenvolvimento
  unit          Executa apenas testes unitários
  integration   Executa apenas testes de integração
  quick         Executa testes sem calcular cobertura
  debug         Executa com debug de handles abertos
  single        Executa apenas um teste específico
                Uso: node tests/run-tests.js single "nome do teste"
  file          Executa testes de um arquivo específico
                Uso: node tests/run-tests.js file auth.test.js

Exemplos:

  npm test                                    # Todos os testes
  node tests/run-tests.js watch              # Modo watch
  node tests/run-tests.js single "Deve registrar"  # Teste específico
  node tests/run-tests.js file auth.test.js  # Arquivo específico
`);
}

function runTests(command, extraArgs = []) {
    if (!commands[command]) {
        console.error(`❌ Comando desconhecido: ${command}`);
        printHelp();
        process.exit(1);
    }

    const testArgs = [...commands[command], ...extraArgs];

    console.log(`🧪 Executando: npx ${testArgs.join(' ')}\n`);

    const testProcess = spawn('npx', testArgs, {
        stdio: 'inherit',
        shell: true
    });

    testProcess.on('exit', (code) => {
        if (code === 0) {
            console.log('\n✅ Todos os testes passaram!');
        } else {
            console.log('\n❌ Alguns testes falharam.');
            process.exit(code);
        }
    });
}

// Parse argumentos
const command = args[0] || 'all';

if (command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    process.exit(0);
}

if (command === 'single') {
    if (!args[1]) {
        console.error('❌ Você precisa especificar o nome do teste');
        console.log('Exemplo: node tests/run-tests.js single "Deve registrar"');
        process.exit(1);
    }
    runTests('single', [args[1]]);
} else if (command === 'file') {
    if (!args[1]) {
        console.error('❌ Você precisa especificar o arquivo de teste');
        console.log('Exemplo: node tests/run-tests.js file auth.test.js');
        process.exit(1);
    }
    runTests('file', [`tests/${args[1]}`]);
} else {
    runTests(command);
}
