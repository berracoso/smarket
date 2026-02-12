const API_URL = '';

// Helper para headers com autenticação
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

function mostrarAlerta(mensagem, tipo = 'success') {
    const container = document.getElementById('alertContainer');
    if (container) {
        container.innerHTML = `
            <div class="alert alert-${tipo} show">
                ${mensagem}
            </div>
        `;
    }
}

function switchTab(tab, clickedElement) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    if (clickedElement) clickedElement.classList.add('active');

    document.querySelectorAll('.form-container').forEach(f => f.classList.remove('active'));
    
    const formId = tab === 'login' ? 'loginForm' : 'registroForm';
    const formElement = document.getElementById(formId);
    if (formElement) formElement.classList.add('active');

    const alertContainer = document.getElementById('alertContainer');
    if (alertContainer) alertContainer.innerHTML = '';
}

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const senha = document.getElementById('loginSenha').value;
    const btnLogin = document.getElementById('btnLogin');

    if (btnLogin) {
        btnLogin.disabled = true;
        btnLogin.textContent = 'Entrando...';
    }

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        if (response.ok) {
            if (data.token) {
                localStorage.setItem('token', data.token);
                // Salvar dados básicos do usuário também ajuda na UI
                localStorage.setItem('usuario', JSON.stringify(data.usuario));
            }

            mostrarAlerta(`✅ Bem-vindo, ${data.usuario.nome}!`, 'success');
            
            // Pequeno delay para o usuário ler a mensagem
            setTimeout(() => {
                if (data.usuario.isAdmin) {
                    window.location.href = '/admin';
                } else {
                    window.location.href = '/';
                }
            }, 1000);
        } else {
            const msgErro = data.mensagem || data.erro || 'Erro ao fazer login';
            mostrarAlerta(msgErro, 'error');
            if (btnLogin) {
                btnLogin.disabled = false;
                btnLogin.textContent = 'Entrar';
            }
        }
    } catch (error) {
        console.error(error);
        mostrarAlerta('Erro de conexão com o servidor', 'error');
        if (btnLogin) {
            btnLogin.disabled = false;
            btnLogin.textContent = 'Entrar';
        }
    }
}

async function handleRegistro(event) {
    event.preventDefault();

    const nome = document.getElementById('registroNome').value;
    const email = document.getElementById('registroEmail').value;
    const senha = document.getElementById('registroSenha').value;
    const btnRegistro = document.getElementById('btnRegistro');

    if (btnRegistro) {
        btnRegistro.disabled = true;
        btnRegistro.textContent = 'Criando conta...';
    }

    try {
        const response = await fetch(`${API_URL}/auth/registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha })
        });

        const data = await response.json();

        if (response.ok) {
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('usuario', JSON.stringify(data.usuario));
            }

            mostrarAlerta(`✅ Conta criada! Bem-vindo, ${data.usuario.nome}!`, 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        } else {
            const msgErro = data.mensagem || data.erro || 'Erro ao criar conta';
            mostrarAlerta(msgErro, 'error');
            if (btnRegistro) {
                btnRegistro.disabled = false;
                btnRegistro.textContent = 'Criar Conta';
            }
        }
    } catch (error) {
        console.error(error);
        mostrarAlerta('Erro de conexão com o servidor', 'error');
        if (btnRegistro) {
            btnRegistro.disabled = false;
            btnRegistro.textContent = 'Criar Conta';
        }
    }
}

async function verificarSessao() {
    const token = localStorage.getItem('token');
    
    // Se não tem token e estamos na página de login, tudo bem.
    // Se não tem token e estamos em rota protegida, redirecionar (lógica deve estar no script da página protegida, não aqui).
    if (!token) return;

    try {
        // CORREÇÃO CRÍTICA: Adicionado headers com Authorization
        const response = await fetch(`${API_URL}/auth/me`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            // Se o usuário tentar acessar login estando logado, redireciona
            if (window.location.pathname.includes('login') || window.location.pathname === '/') {
                 if (data.isAdmin) {
                    window.location.href = '/admin';
                } else {
                    // Já está na home ou vai pra home
                    if (window.location.pathname.includes('login')) window.location.href = '/';
                }
            }
        } else {
            // Token inválido ou expirado
            console.warn('Sessão inválida, limpando dados.');
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            // Só redireciona se NÃO estiver no login para evitar loop
            if (!window.location.pathname.includes('login')) {
                window.location.href = '/login';
            }
        }
    } catch (error) {
        console.error('Erro ao verificar sessão', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab');
    if (tabs) {
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabType = tab.textContent.trim().toLowerCase() === 'login' ? 'login' : 'registro';
                switchTab(tabType, e.target);
            });
        });
    }

    const loginFormElement = document.querySelector('#loginForm form');
    if (loginFormElement) loginFormElement.addEventListener('submit', handleLogin);

    const registroFormElement = document.querySelector('#registroForm form');
    if (registroFormElement) registroFormElement.addEventListener('submit', handleRegistro);

    // Só chama verificarSessao se estivermos na página de login para auto-redirect
    // OU se este script for compartilhado globalmente.
    verificarSessao();
});