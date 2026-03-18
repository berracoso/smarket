/**
 * Permission Interceptor
 * Intercepta todas as requisições fetch para:
 * 1. Injetar o Token JWT automaticamente (Authorization Header)
 * 2. Enviar os cookies de sessão corretamente (Credentials)
 * 3. Validar permissões em tempo real (401/403)
 */

(function () {
    'use strict';

    // Guardar fetch original
    const originalFetch = window.fetch;

    // Sobrescrever fetch global
    window.fetch = async function (...args) {
        let [resource, config] = args;
        const token = localStorage.getItem('token');

        if (!config) {
            config = {};
        }

        // CORREÇÃO: Enviar cookies de sessão em todas as requisições para o backend validar
        config.credentials = 'same-origin';

        if (!config.headers) {
            config.headers = {};
        }
        
        // CORREÇÃO: Avisar o backend que somos uma API e esperamos JSON (evita redirecionamento HTML 302/200)
        if (config.headers instanceof Headers) {
            if (!config.headers.has('Accept')) {
                config.headers.append('Accept', 'application/json');
            }
            if (token) {
                config.headers.append('Authorization', `Bearer ${token}`);
            }
        } else {
            if (!config.headers['Accept']) {
                config.headers['Accept'] = 'application/json';
            }
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
        }
        
        args[1] = config;

        try {
            const response = await originalFetch.apply(this, args);

            // Clonar response para ler o corpo sem consumir
            const clonedResponse = response.clone();

            // Ignorar erros 401 na página de login (verificação de sessão)
            const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/login.html';
            const requestUrl = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
            const isAuthMeRequest = requestUrl.includes('/auth/me');

            // Verificar status de erro de autenticação/permissão
            if (response.status === 401 || response.status === 403) {
                // Na página de login, não mostrar erro para /auth/me (é esperado não estar logado)
                if (isLoginPage && isAuthMeRequest && response.status === 401) {
                    return response;
                }

                try {
                    const data = await clonedResponse.json();

                    // Se der erro 401 (Não autorizado), limpa o token local
                    if (response.status === 401) {
                        localStorage.removeItem('token');
                    }

                    // Tratar erro de permissão revogada (middle-check)
                    if (response.status === 403 && data.tipo === 'permission_revoked') {
                        if (window.showError) {
                            window.showError(data.erro || data.error || 'Você não tem mais permissão para acessar esta área.', 7000);
                        }
                        setTimeout(() => {
                            window.location.href = data.redirecionarPara || '/';
                        }, 2000);
                        return response;
                    }

                    // Tratar erro de autenticação (mas não na página de login)
                    if (response.status === 401 && !isLoginPage) {
                        if (window.showWarning) {
                            window.showWarning('Sessão expirada ou não autorizada. Redirecionando para login...', 3000);
                        }
                        setTimeout(() => {
                            window.location.href = data.redirecionarPara || '/login';
                        }, 1500);
                        return response;
                    }

                    // Outros erros
                    if ((data.erro || data.error) && window.showError && !(isLoginPage && response.status === 401)) {
                        window.showError(data.erro || data.error, 5000);
                    }

                } catch (parseError) {
                    if (response.status === 403 && window.showError) {
                        window.showError('Acesso negado.', 5000);
                    } else if (response.status === 401 && window.showWarning && !isLoginPage) {
                        localStorage.removeItem('token'); // Limpa token inválido
                        window.showWarning('Autenticação necessária.', 3000);
                        setTimeout(() => window.location.href = '/login', 1500);
                    }
                }
            }

            return response;

        } catch (error) {
            console.error('Erro na requisição:', error);
            if (window.showError) {
                window.showError('Erro de conexão. Tente novamente.', 5000);
            }
            throw error;
        }
    };

    // Função para verificar permissões periodicamente
    let permissionCheckInterval = null;

    window.startPermissionCheck = function (intervalMs = 30000) {
        if (permissionCheckInterval) clearInterval(permissionCheckInterval);
        permissionCheckInterval = setInterval(async () => {
            try {
                const response = await fetch('/auth/check-permissions');
                if (!response.ok) return;
                const data = await response.json();
                if (!data.temPermissao) {
                    if (window.showError) window.showError('Permissões alteradas.', 3000);
                    setTimeout(() => window.location.href = '/', 2000);
                }
            } catch (error) {
                console.error('Erro ao verificar permissões:', error);
            }
        }, intervalMs);
    };

    window.stopPermissionCheck = function () {
        if (permissionCheckInterval) {
            clearInterval(permissionCheckInterval);
            permissionCheckInterval = null;
        }
    };

    console.log('✅ Permission/Auth Interceptor ativado');
})();

// Auto-iniciar em admin
if (window.location.pathname === '/admin' || window.location.pathname === '/admin.html') {
    setTimeout(() => {
        if (window.startPermissionCheck) window.startPermissionCheck(30000);
    }, 1000);
}