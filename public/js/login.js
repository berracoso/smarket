const API_URL = '';

// Mostrar alerta
function mostrarAlerta(mensagem, tipo = 'success') {
    const alertHTML = `
        <div class="alert alert-${tipo} show">
            ${mensagem}
        </div>
    `;
    document.getElementById('alertContainer').innerHTML = alertHTML;
}

// Trocar entre tabs
function switchTab(tab, clickedElement) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    clickedElement.classList.add('active');

    document.querySelectorAll('.form-container').forEach(f => f.classList.remove('active'));
    if (tab === 'login') {
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.getElementById('registroForm').classList.add('active');
    }
    document.getElementById('alertContainer').innerHTML = '';
}

// Handle Login
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const senha = document.getElementById('loginSenha').value;
    const btnLogin = document.getElementById('btnLogin');

    btnLogin.disabled = true;
    btnLogin.textContent = 'Entrando...';

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        if (response.ok) {
            mostrarAlerta(`✅ Bem-vindo, ${data.usuario.nome}!`, 'success');
            setTimeout(() => {
                if (data.usuario.isAdmin) {
                    window.location.href = '/admin';
                } else {
                    window.location.href = '/';
                }
            }, 1000);
        } else {
            // CORREÇÃO: Tenta ler data.mensagem primeiro, depois data.erro (se for string)
            const msgErro = data.mensagem || (typeof data.erro === 'string' ? data.erro : 'Erro ao fazer login');
            mostrarAlerta(msgErro, 'error');
            btnLogin.disabled = false;
            btnLogin.textContent = 'Entrar';
        }
    } catch (error) {
        mostrarAlerta('Erro ao conectar com servidor', 'error');
        btnLogin.disabled = false;
        btnLogin.textContent = 'Entrar';
    }
}

// Handle Registro
async function handleRegistro(event) {
    event.preventDefault();

    const nome = document.getElementById('registroNome').value;
    const email = document.getElementById('registroEmail').value;
    const senha = document.getElementById('registroSenha').value;
    const btnRegistro = document.getElementById('btnRegistro');

    btnRegistro.disabled = true;
    btnRegistro.textContent = 'Criando conta...';

    try {
        const response = await fetch(`${API_URL}/auth/registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ nome, email, senha })
        });

        const data = await response.json();

        if (response.ok) {
            mostrarAlerta(`✅ Conta criada! Bem-vindo, ${data.usuario.nome}!`, 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        } else {
            // CORREÇÃO: Tenta ler data.mensagem primeiro
            const msgErro = data.mensagem || (typeof data.erro === 'string' ? data.erro : 'Erro ao criar conta');
            mostrarAlerta(msgErro, 'error');
            btnRegistro.disabled = false;
            btnRegistro.textContent = 'Criar Conta';
        }
    } catch (error) {
        mostrarAlerta('Erro ao conectar com servidor', 'error');
        btnRegistro.disabled = false;
        btnRegistro.textContent = 'Criar Conta';
    }
}

// Verificar se já está logado
async function verificarSessao() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            if (data.usuario.isAdmin) {
                window.location.href = '/admin';
            } else {
                window.location.href = '/';
            }
        }
    } catch (error) {
        // Não faz nada, usuário fica na tela de login
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabType = tab.textContent.trim().toLowerCase() === 'login' ? 'login' : 'registro';
            switchTab(tabType, e.target);
        });
    });

    const loginFormElement = document.querySelector('#loginForm form');
    if (loginFormElement) loginFormElement.addEventListener('submit', handleLogin);

    const registroFormElement = document.querySelector('#registroForm form');
    if (registroFormElement) registroFormElement.addEventListener('submit', handleRegistro);

    verificarSessao();
});