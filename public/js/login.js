const API_URL = '';

// Helper para headers
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
            // CORREÇÃO: O backend retorna "user" na resposta da sessão
            const usuario = data.user || data.usuario;
            
            if (usuario) {
                // Guarda os dados básicos do usuário para o front
                localStorage.setItem('usuario', JSON.stringify(usuario));
                mostrarAlerta(`✅ Bem-vindo, ${usuario.nome}!`, 'success');
                
                // Delay para o redirecionamento
                setTimeout(() => {
                    if (usuario.isAdmin || usuario.isSuperAdmin) {
                        window.location.href = '/admin';
                    } else {
                        window.location.href = '/';
                    }
                }, 1000);
            } else {
                mostrarAlerta(`✅ Login realizado com sucesso!`, 'success');
                setTimeout(() => window.location.href = '/', 1000);
            }
        } else {
            const msgErro = data.mensagem || data.erro || 'Erro ao fazer login';
            mostrarAlerta(msgErro, 'error');
            if (btnLogin) {
                btnLogin.disabled = false;
                btnLogin.textContent = 'Entrar';
            }
        }
    } catch (error) {
        console.error('Erro no catch do login:', error);
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
        // CORREÇÃO: A rota correta no backend é /register
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha })
        });

        const data = await response.json();

        if (response.ok) {
            // CORREÇÃO: O backend só retorna a mensagem de sucesso na criação, então direcionamos para o login
            mostrarAlerta(`✅ Conta criada com sucesso! Faça login para entrar.`, 'success');
            setTimeout(() => {
                switchTab('login', document.querySelector('.tab:first-child'));
                document.getElementById('loginEmail').value = email;
                document.getElementById('loginSenha').focus();
                
                if (btnRegistro) {
                    btnRegistro.disabled = false;
                    btnRegistro.textContent = 'Criar Conta';
                }
            }, 1500);
        } else {
            const msgErro = data.mensagem || data.erro || 'Erro ao criar conta';
            mostrarAlerta(msgErro, 'error');
            if (btnRegistro) {
                btnRegistro.disabled = false;
                btnRegistro.textContent = 'Criar Conta';
            }
        }
    } catch (error) {
        console.error('Erro no catch do registro:', error);
        mostrarAlerta('Erro de conexão com o servidor', 'error');
        if (btnRegistro) {
            btnRegistro.disabled = false;
            btnRegistro.textContent = 'Criar Conta';
        }
    }
}

async function verificarSessao() {
    try {
        // Agora o AuthController usa Cookies, então o navegador envia a sessão automaticamente
        const response = await fetch(`${API_URL}/auth/me`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            const usuario = data.user || data;
            
            if (usuario) {
                localStorage.setItem('usuario', JSON.stringify(usuario));
            }

            // Se estiver na página de login e estiver logado, redireciona
            if (window.location.pathname.includes('login') || window.location.pathname === '/') {
                 if (usuario.isAdmin || usuario.isSuperAdmin) {
                    window.location.href = '/admin';
                } else {
                    if (window.location.pathname.includes('login')) window.location.href = '/';
                }
            }
        } else {
            // Limpa rastros se a sessão for inválida
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
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

    // Verifica a sessão ao carregar a página
    verificarSessao();
});