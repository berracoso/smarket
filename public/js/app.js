const API_URL = '';
let timeSelecionado = null;
let resumoAtual = null;
let usuarioAtual = null;

function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
}

async function verificarAuth() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            usuarioAtual = data.user || data.usuario || data; 
            atualizarInterfaceUsuario();
            carregarConta(); 
            
            if (document.getElementById('secaoMinhasApostas')?.classList.contains('active')) {
                carregarMinhasApostas();
            }
        } else {
            logout();
        }
    } catch (error) {
        console.error('Erro na autenticação:', error);
    }
}

function atualizarInterfaceUsuario() {
    const menuAdmin = document.getElementById('menuAdmin');
    const apostaCard = document.getElementById('apostaCard');
    const superAdminAlert = document.getElementById('superAdminAlert');
    const superAdminAlertMinhas = document.getElementById('superAdminAlertMinhas');
    const userName = document.getElementById('userName');

    if (menuAdmin) menuAdmin.style.display = 'none';
    if (superAdminAlert) superAdminAlert.style.display = 'none';
    if (superAdminAlertMinhas) superAdminAlertMinhas.style.display = 'none';
    if (apostaCard) apostaCard.style.display = 'block';

    if (!usuarioAtual) return;

    if (usuarioAtual.isAdmin || usuarioAtual.isSuperAdmin) {
        if (menuAdmin) menuAdmin.style.display = 'flex';
    }

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

function mostrarSecao(secao) {
    document.querySelectorAll('.section-content').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));

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

    if (mapaSecoes[secao]) document.getElementById(mapaSecoes[secao]).classList.add('active');
    if (mapaMenus[secao]) document.getElementById(mapaMenus[secao]).classList.add('active');

    if (secao === 'minhas-apostas') carregarMinhasApostas();
    else if (secao === 'conta') carregarConta();
}

async function carregarMinhasApostas() {
    try {
        const response = await fetch(`${API_URL}/apostas/minhas`, { headers: getAuthHeaders() });
        if (response.ok) {
            const data = await response.json();
            processarApostas(data);
        } else {
            document.getElementById('minhasApostasContainer').innerHTML = '<p style="color: #ef4444; text-align: center;">Não foi possível carregar suas apostas.</p>';
        }
    } catch (error) {
        document.getElementById('minhasApostasContainer').innerHTML = '<p style="color: #ef4444; text-align: center;">Erro de conexão.</p>';
    }
}

function processarApostas(data) {
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

function carregarConta() {
    if (!usuarioAtual) return;

    const tipoLabel = usuarioAtual.isSuperAdmin ? 'Super Administrador' : usuarioAtual.isAdmin ? 'Administrador' : 'Usuário';
    
    const contaHTML = `
        <div class="conta-info">
            <div class="field"><div class="label">Nome</div><div class="value">${usuarioAtual.nome}</div></div>
            <div class="field"><div class="label">Email</div><div class="value">${usuarioAtual.email}</div></div>
            <div class="field"><div class="label">Tipo de Conta</div><div class="value">${tipoLabel}</div></div>
        </div>
        <button class="btn btn-danger btn-logout-conta" style="width: 100%; background-color:#ef4444; margin-top: 15px;">
            <p style="color:#f7f2f2">🚪 Sair da Conta </p>
        </button>
    `;

    document.getElementById('contaContainer').innerHTML = contaHTML;
    setTimeout(() => {
        const btn = document.querySelector('.btn-logout-conta');
        if(btn) btn.addEventListener('click', logout);
    }, 100);
}

async function logout() {
    try { await fetch(`${API_URL}/auth/logout`, { method: 'POST', headers: getAuthHeaders() }); } catch(e) {}
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login';
}

// CORREÇÃO CRÍTICA: Carregar o Resumo pegando as Estatísticas Corretas do novo Backend
async function carregarResumo() {
    try {
        const response = await fetch(`${API_URL}/eventos/ativo`, { headers: getAuthHeaders() });
        
        if (response.ok) {
            const data = await response.json();
            // Acomodando o formato Clean Architecture
            if (data.sucesso && data.evento) {
                resumoAtual = data.evento;
                resumoAtual.estatisticas = data.estatisticas; // Salva estatisticas dentro do resumo
            } else {
                resumoAtual = data.evento || data;
            }
            atualizarInterface();
        }
    } catch (error) {
        console.error('Erro ao carregar resumo', error);
    }
}

// CORREÇÃO CRÍTICA: Adaptar renderização dos times para Arrays (ao invés de Objects)
function atualizarInterface() {
    if(!resumoAtual) return;
    const evento = resumoAtual;
    const estatisticas = evento.estatisticas || null;

    // A nova API retorna times como Array: ["Time A", "Time B"]
    const isArray = Array.isArray(evento.times);
    const timesArray = isArray ? evento.times : Object.keys(evento.times || {});
    const temTimes = timesArray.length > 0;
    const estaAberto = evento.status === 'aberto' || evento.aberto === true;

    // Status
    const statusContainer = document.getElementById('statusContainer');
    if(statusContainer) {
        const statusHTML = estaAberto
            ? `<span class="status-badge status-aberto">✅ Apostas Abertas</span>`
            : `<span class="status-badge status-fechado">🔒 Apostas Fechadas</span>`;
        statusContainer.innerHTML = statusHTML;
    }

    // Renderizar Times Grid
    const timesGrid = document.getElementById('timesGrid');
    if(timesGrid) {
        let timesHTML = '';
        if (temTimes) {
            timesHTML = timesArray.map(time => {
                // Calcular porcentagem baseado nas estatisticas
                let percentual = 0;
                if (isArray && estatisticas && estatisticas.totalArrecadado > 0) {
                    const arrecadadoTime = estatisticas.totalPorTime[time] || 0;
                    percentual = (arrecadadoTime / estatisticas.totalArrecadado) * 100;
                } else if (!isArray && evento.times[time]) {
                    percentual = evento.times[time].percentual || 0;
                }

                const selected = timeSelecionado === time ? 'selected' : '';
                return `
                    <div class="time-option ${selected}" data-time="${time}">
                        <div class="time-name">${time}</div>
                        <div class="time-prob">${percentual.toFixed(1)}%</div>
                    </div>
                `;
            }).join('');
        } else {
            timesHTML = `<div class="empty-state" style="grid-column: 1 / -1;"><div>📭</div><div>Nenhum time disponível</div></div>`;
        }
        timesGrid.innerHTML = timesHTML;
    }

    if (temTimes) {
        document.querySelectorAll('.time-option').forEach(el => {
            el.addEventListener('click', () => {
                timeSelecionado = el.dataset.time;
                atualizarInterface();
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
    if(!alertContainer) { alert(mensagem); return; }
    alertContainer.innerHTML = `<div class="alert alert-${tipo}">${mensagem}</div>`;
    setTimeout(() => { alertContainer.innerHTML = ''; }, 5000);
}

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
    const menuApostas = document.getElementById('menuApostas');
    const menuMinhasApostas = document.getElementById('menuMinhasApostas');
    const menuConta = document.getElementById('menuConta');
    const menuAdmin = document.getElementById('menuAdmin');

    if (menuApostas) menuApostas.addEventListener('click', () => mostrarSecao('apostas'));
    if (menuMinhasApostas) menuMinhasApostas.addEventListener('click', () => mostrarSecao('minhas-apostas'));
    if (menuConta) menuConta.addEventListener('click', () => mostrarSecao('conta'));
    if (menuAdmin) menuAdmin.addEventListener('click', () => window.location.href = '/admin');

    const apostaForm = document.getElementById('apostaForm');
    if (apostaForm) {
        apostaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!timeSelecionado) return mostrarAlerta('Selecione um time', 'error');

            const valor = parseFloat(document.getElementById('valor').value);
            if (!valor || valor <= 0) return mostrarAlerta('Valor inválido', 'error');

            try {
                const response = await fetch(`${API_URL}/apostas`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ time: timeSelecionado, valor })
                });

                const data = await response.json();

                if (response.ok) {
                    mostrarAlerta(`✅ Aposta de R$ ${valor} confirmada no ${timeSelecionado}!`, 'success');
                    apostaForm.reset();
                    timeSelecionado = null;
                    document.getElementById('retornoContainer').innerHTML = '';
                    carregarResumo();
                } else {
                    mostrarAlerta(data.erro || data.error || data.message || 'Erro ao apostar', 'error');
                }
            } catch (error) {
                mostrarAlerta('Erro de conexão', 'error');
            }
        });
    }

    const valorInput = document.getElementById('valor');
    if (valorInput) valorInput.addEventListener('input', calcularRetorno);

    verificarAuth();
    carregarResumo();
    setInterval(carregarResumo, 10000);
});