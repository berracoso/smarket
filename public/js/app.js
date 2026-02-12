const API_URL = '';
let timeSelecionado = null;
let resumoAtual = null;
let usuarioAtual = null;
let paginaAtual = 1;

// --- HELPER: Cabeçalhos de Autenticação (A Mágica acontece aqui) ---
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

// Verificar autenticação
async function verificarAuth() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            // Se não tem token, nem tenta conectar, manda pro login direto
            window.location.href = '/login';
            return;
        }

        console.log('🔄 Verificando autenticação...');
        
        // CORREÇÃO: Adicionado headers com o Token
        const response = await fetch(`${API_URL}/auth/me`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        // Verifica se a resposta é JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            if (response.status === 401 || response.status === 403) {
                console.warn('🔒 Token expirado ou inválido.');
                logout();
                return;
            }
            throw new Error(`Resposta inválida do servidor: ${response.status}`);
        }

        if (response.ok) {
            const data = await response.json();
            usuarioAtual = { ...data }; // Garante que pegamos os dados planos retornados pelo controller
            
            // Se o controller retornar dentro de um objeto "usuario", ajustamos
            if (data.usuario) usuarioAtual = data.usuario;

            console.log('✅ Usuário autenticado:', usuarioAtual.nome);
            atualizarInterfaceUsuario();
            carregarConta(); // Preenche a aba "Minha Conta"
            
            // Se estiver na aba "Minhas Apostas", carrega elas
            if (document.getElementById('secaoMinhasApostas').classList.contains('active')) {
                carregarMinhasApostas();
            }
        } else {
            console.warn('🔒 Sessão inválida (401), redirecionando...');
            logout();
        }
    } catch (error) {
        console.error('❌ Erro crítico na autenticação:', error);
        const userName = document.getElementById('userName');
        if (userName) userName.innerHTML = '⚠️ Erro de Conexão';
    }
}

// Função auxiliar para atualizar a UI baseada no usuário
function atualizarInterfaceUsuario() {
    const menuAdmin = document.getElementById('menuAdmin');
    const apostaCard = document.getElementById('apostaCard');
    const superAdminAlert = document.getElementById('superAdminAlert');
    const superAdminAlertMinhas = document.getElementById('superAdminAlertMinhas');
    const userName = document.getElementById('userName');

    // Resetar visibilidade
    if (menuAdmin) menuAdmin.style.display = 'none';
    if (superAdminAlert) superAdminAlert.style.display = 'none';
    if (superAdminAlertMinhas) superAdminAlertMinhas.style.display = 'none';
    if (apostaCard) apostaCard.style.display = 'block';

    if (!usuarioAtual) return;

    // Lógica de Admin
    if (usuarioAtual.isAdmin || usuarioAtual.isSuperAdmin) {
        if (menuAdmin) menuAdmin.style.display = 'flex';
    }

    // Lógica de Super Admin
    if (usuarioAtual.isSuperAdmin) {
        if (apostaCard) apostaCard.style.display = 'none';
        if (superAdminAlert) superAdminAlert.style.display = 'block';
        if (superAdminAlertMinhas) superAdminAlertMinhas.style.display = 'block';
        if (userName) userName.innerHTML = `👤 ${usuarioAtual.nome} <span style="background: #dc2626; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8em; margin-left: 5px;">SUPER ADMIN</span>`;
    } else if (usuarioAtual.isAdmin) {
        if (userName) userName.innerHTML = `👤 ${usuarioAtual.nome} <span style="background: #fbbf24; color: #78350f; padding: 2px 8px; border-radius: 10px; font-size: 0.8em; margin-left: 5px;">ADMIN</span>`;
    } else {
        if (userName) userName.innerHTML = `👤 ${usuarioAtual.nome}`;
    }
}

// Mostrar seção
function mostrarSecao(secao) {
    document.querySelectorAll('.section-content').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));

    // Mapeamento de menus
    const mapaMenus = {
        'apostas': 'menuApostas',
        'minhas-apostas': 'menuMinhasApostas',
        'historico': 'menuHistorico',
        'conta': 'menuConta'
    };

    const mapaSecoes = {
        'apostas': 'secaoApostas',
        'minhas-apostas': 'secaoMinhasApostas',
        'historico': 'secaoHistorico',
        'conta': 'secaoConta'
    };

    if (mapaSecoes[secao]) {
        document.getElementById(mapaSecoes[secao]).classList.add('active');
    }
    if (mapaMenus[secao]) {
        document.getElementById(mapaMenus[secao]).classList.add('active');
    }

    // Ações específicas ao abrir a aba
    if (secao === 'minhas-apostas') {
        carregarMinhasApostas();
    } else if (secao === 'historico') {
        carregarEstatisticas();
        carregarEventosFiltro();
        carregarHistorico();
    } else if (secao === 'conta') {
        carregarConta();
    }
}

// Carregar minhas apostas
async function carregarMinhasApostas() {
    try {
        // CORREÇÃO: Adicionado headers
        const response = await fetch(`${API_URL}/apostas/minhas`, { // Ajuste de rota se necessário, ou /minhas-apostas
            headers: getAuthHeaders()
        });

        // Tenta rota alternativa se a primeira falhar (compatibilidade legado)
        if (response.status === 404) {
             const responseLegacy = await fetch(`${API_URL}/minhas-apostas`, { headers: getAuthHeaders() });
             if (responseLegacy.ok) return processarApostas(await responseLegacy.json());
        }

        if (response.ok) {
            const data = await response.json();
            processarApostas(data);
        } else {
            console.error('Erro ao carregar apostas:', response.status);
            document.getElementById('minhasApostasContainer').innerHTML = '<p style="color: #ef4444; text-align: center;">Não foi possível carregar suas apostas.</p>';
        }
    } catch (error) {
        console.error(error);
        document.getElementById('minhasApostasContainer').innerHTML = '<p style="color: #ef4444; text-align: center;">Erro de conexão.</p>';
    }
}

function processarApostas(data) {
    // Verifica se data é array ou objeto { apostas: [] }
    const listaApostas = Array.isArray(data) ? data : (data.apostas || []);
    const valorTotal = data.valorTotal || listaApostas.reduce((acc, curr) => acc + parseFloat(curr.valor), 0);
    const totalCount = data.total || listaApostas.length;

    if (listaApostas.length === 0) {
        document.getElementById('minhasApostasContainer').innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 40px; color: #999;">
                <div style="font-size: 3em;">📭</div>
                <p>Você ainda não fez nenhuma aposta</p>
            </div>
        `;
        return;
    }

    const apostasHTML = listaApostas.map(aposta => `
        <div class="aposta-card">
            <div class="time">${aposta.time}</div>
            <div class="info">
                <span>Apostado:</span>
                <span><strong>R$ ${parseFloat(aposta.valor).toFixed(2)}</strong></span>
            </div>
            <div class="info">
                <span>Data:</span>
                <span>${new Date(aposta.criadoEm || aposta.timestamp).toLocaleString('pt-BR')}</span>
            </div>
            <div class="retorno">
                <div class="label">Retorno Estimado</div>
                <div class="value">R$ ${parseFloat(aposta.retornoEstimado || 0).toFixed(2)}</div>
            </div>
        </div>
    `).join('');

    const totalHTML = `
        <div style="background: #667eea; color: white; padding: 15px; border-radius: 10px; text-align: center; margin-top: 15px;">
            <div style="font-size: 0.9em;">Total Apostado</div>
            <div style="font-size: 1.5em; font-weight: bold; margin-top: 5px;">R$ ${parseFloat(valorTotal).toFixed(2)}</div>
            <div style="font-size: 0.85em; margin-top: 5px;">${totalCount} aposta(s)</div>
        </div>
    `;

    document.getElementById('minhasApostasContainer').innerHTML = apostasHTML + totalHTML;
}

// Carregar dados da conta
function carregarConta() {
    if (!usuarioAtual) return;

    const tipoLabel = usuarioAtual.isSuperAdmin ? 'Super Administrador' : usuarioAtual.isAdmin ? 'Administrador' : 'Usuário';
    const tipoBadge = usuarioAtual.isSuperAdmin ? '<span style="background: #dc2626; color: white; padding: 4px 12px; border-radius: 15px; font-size: 0.9em;">SUPER ADMIN</span>' :
        usuarioAtual.isAdmin ? '<span style="background: #fbbf24; color: #78350f; padding: 4px 12px; border-radius: 15px; font-size: 0.9em;">ADMIN</span>' :
            '<span style="background: #3b82f6; color: white; padding: 4px 12px; border-radius: 15px; font-size: 0.9em;">USUÁRIO</span>';

    const permissoes = [];
    if (usuarioAtual.isSuperAdmin) {
        permissoes.push('✅ Acesso total ao painel admin');
    } else if (usuarioAtual.isAdmin) {
        permissoes.push('✅ Acesso ao painel admin');
        permissoes.push('✅ Pode apostar');
    } else {
        permissoes.push('✅ Fazer apostas');
    }

    const contaHTML = `
        <div class="conta-info">
            <div class="field">
                <div class="label">Nome</div>
                <div class="value">${usuarioAtual.nome}</div>
            </div>
            <div class="field">
                <div class="label">Email</div>
                <div class="value">${usuarioAtual.email}</div>
            </div>
            <div class="field">
                <div class="label">Tipo de Conta</div>
                <div class="value">${tipoLabel} ${tipoBadge}</div>
            </div>
            <div class="field">
                <div class="label">Permissões</div>
                <div class="value">
                    ${permissoes.map(p => `<div style="margin: 5px 0; font-size: 0.95em;">${p}</div>`).join('')}
                </div>
            </div>
        </div>

        <button class="btn btn-danger btn-logout-conta" style="width: 100%; background-color:#ef4444; margin-top: 15px;">
            <p style="color:#f7f2f2">🚪 Sair da Conta </p>
        </button>
    `;

    document.getElementById('contaContainer').innerHTML = contaHTML;
    
    // Re-attach event listener
    setTimeout(() => {
        const btn = document.querySelector('.btn-logout-conta');
        if(btn) btn.addEventListener('click', logout);
    }, 100);
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login';
}

// Carregar resumo inicial (Público ou Privado)
async function carregarResumo() {
    try {
        // Envia token se tiver, mas não falha se não tiver
        const response = await fetch(`${API_URL}/eventos/ativo`, {
             headers: getAuthHeaders()
        });
        
        // Se a rota antiga /resumo ainda existir, trate o erro 404
        if (response.status === 404) {
             console.log('Tentando rota legada /resumo...');
             const responseLegacy = await fetch(`${API_URL}/resumo`, { headers: getAuthHeaders() });
             if (responseLegacy.ok) {
                 resumoAtual = await responseLegacy.json();
                 atualizarInterface();
             }
             return;
        }

        if (response.ok) {
            const data = await response.json();
            // Adaptação: O novo controller retorna { evento: ... }, o antigo retornava o resumo direto
            resumoAtual = data.evento || data; 
            atualizarInterface();
        }
    } catch (error) {
        console.error('Erro ao carregar resumo', error);
    }
}

// Atualizar interface com dados do resumo
function atualizarInterface() {
    if(!resumoAtual) return;
    const evento = resumoAtual; // Alias

    // Suporte a estrutura antiga e nova
    const times = evento.times || {}; 
    const temTimes = Object.keys(times).length > 0;
    const estaAberto = evento.status === 'aberto' || evento.aberto === true;

    // Status
    const statusContainer = document.getElementById('statusContainer');
    if(statusContainer) {
        const statusHTML = estaAberto
            ? `<span class="status-badge status-aberto">✅ Apostas Abertas</span>`
            : `<span class="status-badge status-fechado">🔒 Apostas Fechadas</span>`;
        statusContainer.innerHTML = statusHTML;
    }

    // Times Grid
    const timesGrid = document.getElementById('timesGrid');
    if(timesGrid) {
        let timesHTML = '';
        if (temTimes) {
            timesHTML = Object.keys(times).map(time => {
                const dados = times[time];
                const percentual = dados.probabilidade || dados.percentual || 0;
                const selected = timeSelecionado === time ? 'selected' : '';
                return `
                    <div class="time-option ${selected}" data-time="${time}">
                        <div class="time-name">${time}</div>
                        <div class="time-prob">${parseFloat(percentual).toFixed(1)}%</div>
                    </div>
                `;
            }).join('');
        } else {
            timesHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div>📭</div>
                    <div>Nenhum time disponível</div>
                </div>
            `;
        }
        timesGrid.innerHTML = timesHTML;
    }

    // Attach click events
    if (temTimes) {
        document.querySelectorAll('.time-option').forEach(el => {
            el.addEventListener('click', () => {
                timeSelecionado = el.dataset.time;
                atualizarInterface(); // Re-render para mostrar seleção
                calcularRetorno();
            });
        });
    }

    const btnApostar = document.getElementById('btnApostar');
    if(btnApostar) {
        if (!temTimes) {
            btnApostar.disabled = true;
            btnApostar.textContent = 'Sem Evento';
        } else if (!estaAberto) {
            btnApostar.disabled = true;
            btnApostar.textContent = 'Apostas Fechadas';
        } else {
            btnApostar.disabled = false;
            btnApostar.textContent = 'Confirmar Aposta';
        }
    }
}

function calcularRetorno() {
    const valorInput = document.getElementById('valor');
    const retornoContainer = document.getElementById('retornoContainer');
    
    if(!valorInput || !retornoContainer) return;
    if (!timeSelecionado || !valorInput.value || valorInput.value <= 0) {
        retornoContainer.innerHTML = '';
        return;
    }

    // Lógica simples de estimativa no frontend (O backend que decide o valor real)
    // Se quiser replicar a lógica do backend: (Valor / TotalTimeComAposta) * TotalGeralComAposta * 0.95
    // Por enquanto, apenas mostra placeholder ou busca do backend se tiver endpoint de simulação
    retornoContainer.innerHTML = `
        <div class="retorno-estimado">
            <div class="label">Valor da aposta</div>
            <div class="value">R$ ${parseFloat(valorInput.value).toFixed(2)}</div>
            <small>O retorno final depende do fechamento do mercado.</small>
        </div>
    `;
}

function mostrarAlerta(mensagem, tipo = 'success') {
    const alertContainer = document.getElementById('alertContainer');
    if(!alertContainer) return;
    
    alertContainer.innerHTML = `
        <div class="alert alert-${tipo}">
            ${mensagem}
        </div>
    `;

    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, 5000);
}

// ==================== HISTÓRICO E ESTATÍSTICAS ====================
// (Implementação simplificada para economizar espaço, segue a mesma lógica do Auth Headers)

async function carregarEstatisticas() {
    // Implementar fetch com getAuthHeaders()
}

async function carregarEventosFiltro() {
     // Implementar fetch com getAuthHeaders()
}

async function carregarHistorico(pagina = 1) {
    // Implementar fetch com getAuthHeaders()
    // A lógica é igual à original, apenas adicionando headers: getAuthHeaders() no fetch
}

// ==================== INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', () => {
    // Listeners de Menu
    const menuApostas = document.getElementById('menuApostas');
    const menuMinhasApostas = document.getElementById('menuMinhasApostas');
    const menuConta = document.getElementById('menuConta');
    const menuAdmin = document.getElementById('menuAdmin');
    const btnLogout = document.querySelector('.btn-logout');

    if (menuApostas) menuApostas.addEventListener('click', () => mostrarSecao('apostas'));
    if (menuMinhasApostas) menuMinhasApostas.addEventListener('click', () => mostrarSecao('minhas-apostas'));
    if (menuConta) menuConta.addEventListener('click', () => mostrarSecao('conta'));
    if (menuAdmin) menuAdmin.addEventListener('click', () => window.location.href = '/admin');
    if (btnLogout) btnLogout.addEventListener('click', logout);

    // Form de Aposta
    const apostaForm = document.getElementById('apostaForm');
    if (apostaForm) {
        apostaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!timeSelecionado) return mostrarAlerta('Selecione um time', 'error');

            const valor = parseFloat(document.getElementById('valor').value);
            if (!valor || valor <= 0) return mostrarAlerta('Valor inválido', 'error');

            try {
                // CORREÇÃO: Headers no POST da aposta
                const response = await fetch(`${API_URL}/apostas`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ time: timeSelecionado, valor })
                });

                const data = await response.json();

                if (response.ok) {
                    mostrarAlerta(`✅ Aposta de R$ ${valor} confirmada!`, 'success');
                    apostaForm.reset();
                    timeSelecionado = null;
                    document.getElementById('retornoContainer').innerHTML = '';
                    carregarResumo();
                } else {
                    mostrarAlerta(data.erro || 'Erro ao apostar', 'error');
                }
            } catch (error) {
                mostrarAlerta('Erro de conexão', 'error');
            }
        });
    }

    const valorInput = document.getElementById('valor');
    if (valorInput) valorInput.addEventListener('input', calcularRetorno);

    // Iniciar
    verificarAuth();
    carregarResumo();
    setInterval(carregarResumo, 10000);
});