/**
 * Permission Interceptor
 * Intercepta todas as requisições fetch e valida permissões em tempo real
 * Detecta 403/401 e redireciona automaticamente
 */

(function () {
    'use strict';

    // Guardar fetch original
    const originalFetch = window.fetch;

    // Sobrescrever fetch global
    window.fetch = async function (...args) {
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

                    // Tratar erro de permissão revogada (middle-check)
                    if (response.status === 403 && data.tipo === 'permission_revoked') {
                        // Exibir mensagem flash
                        if (window.showError) {
                            window.showError(data.erro || 'Você não tem mais permissão para acessar esta área.', 7000);
                        }

                        // Aguardar 2 segundos para usuário ler a mensagem
                        setTimeout(() => {
                            // Redirecionar para página indicada
                            const redirecionarPara = data.redirecionarPara || '/';
                            window.location.href = redirecionarPara;
                        }, 2000);

                        // Retornar resposta original (mas já iniciou redirecionamento)
                        return response;
                    }

                    // Tratar erro de autenticação (mas não na página de login)
                    if (response.status === 401 && data.tipo === 'auth_required' && !isLoginPage) {
                        if (window.showWarning) {
                            window.showWarning('Sessão expirada. Redirecionando para login...', 3000);
                        }

                        setTimeout(() => {
                            window.location.href = data.redirecionarPara || '/login';
                        }, 1500);

                        return response;
                    }

                    // Outros erros 403/401 (mas não 401 na página de login)
                    if (data.erro && window.showError && !(isLoginPage && response.status === 401)) {
                        window.showError(data.erro, 5000);
                    }

                } catch (parseError) {
                    // Se não conseguir parsear JSON, exibir mensagem genérica (mas não na página de login para 401)
                    if (response.status === 403 && window.showError) {
                        window.showError('Acesso negado. Você não tem permissão para esta ação.', 5000);
                    } else if (response.status === 401 && window.showWarning && !isLoginPage) {
                        window.showWarning('Autenticação necessária.', 3000);
                        setTimeout(() => window.location.href = '/login', 1500);
                    }
                }
            }

            return response;

        } catch (error) {
            // Erro de rede ou outro erro não relacionado a HTTP
            console.error('Erro na requisição:', error);
            if (window.showError) {
                window.showError('Erro de conexão. Tente novamente.', 5000);
            }
            throw error;
        }
    };

    // Função para verificar permissões periodicamente (heartbeat)
    let permissionCheckInterval = null;

    window.startPermissionCheck = function (intervalMs = 30000) {
        // Limpar intervalo anterior se existir
        if (permissionCheckInterval) {
            clearInterval(permissionCheckInterval);
        }

        // Verificar permissões periodicamente
        permissionCheckInterval = setInterval(async () => {
            try {
                const response = await fetch('/auth/check-permissions');

                if (!response.ok) {
                    // Se retornar erro, o interceptor já tratará
                    return;
                }

                const data = await response.json();

                // Verificar se usuário ainda tem permissão
                if (!data.temPermissao) {
                    if (window.showError) {
                        window.showError('Suas permissões foram alteradas. Redirecionando...', 3000);
                    }
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

    // Log para debug
    console.log('✅ Permission Interceptor ativado');
    console.log('📡 Todas as requisições fetch são monitoradas');
    console.log('🔒 Middle-check de permissões em tempo real habilitado');

})();

// Auto-iniciar verificação periódica de permissões em páginas admin
if (window.location.pathname === '/admin') {
    // Iniciar verificação a cada 30 segundos
    setTimeout(() => {
        if (window.startPermissionCheck) {
            window.startPermissionCheck(30000);
            console.log('🔄 Verificação periódica de permissões iniciada (30s)');
        }
    }, 1000);
}
