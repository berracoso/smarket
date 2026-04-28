const API_URL = '';
let resumoAtual = null;
let estatisticasAtual = null;
let apostasAtual = [];
let usuariosLista = [];
let usuarioLogado = null;

// ==========================================
// 🛡️ CORE: Utilitários Anti-Bugs & Headers
// ==========================================

// Função CRUCIAL: Adiciona o Token de Autenticação em todas as requisições
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return { 
        'Content-Type': 'application/json', 
        'Accept': 'application/json', 
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Authorization': `Bearer ${token}` 
    };
}

const extrairErro = (data) => {
    if (!data) return 'Erro desconhecido de rede.';
    if (data.mensagem) return data.mensagem;
    if (data.message) return data.message;
    if (typeof data.erro === 'string') return data.erro;
    if (typeof data.error === 'string') return data.error;
    return 'Falha na operação solicitada pelo servidor.';
};

function mostrarAlerta(mensagem, tipo = 'success') {
    const alertContainer = document.getElementById('alertContainer');
    if (alertContainer) {
        alertContainer.innerHTML = `<div class="alert alert-${tipo}">${mensagem}</div>`;
        setTimeout(() => { alertContainer.innerHTML = ''; }, 5000);
    } else {
        alert(mensagem);
    }
}

// ==========================================
// 🔄 CORE: Sincronia e Autenticação
// ==========================================
async function verificarAuth() {
    try {
        const response = await fetch(`${API_URL}/auth/me?_t=${Date.now()}`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            usuarioLogado = data.user || data.usuario || data;

            if (!usuarioLogado || (!usuarioLogado.isAdmin && !usuarioLogado.isSuperAdmin)) {
                mostrarAlerta('Acesso negado. Apenas administradores.', 'error');
                setTimeout(() => { window.location.href = '/'; }, 2000);
            }
        } else {
            window.location.href = '/login';
        }
    } catch (error) {
        window.location.href = '/login';
    }
}

async function logout() {
    try { await fetch(`${API_URL}/auth/logout`, { method: 'POST', headers: getAuthHeaders() }); } catch (error) {}
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login';
}

async function carregarDados() {
    try {
        const ts = Date.now();

        // Alterado de /dados para /apostas/todas para bater com a nova arquitetura
        const [resumoRes, dadosRes, usuariosRes] = await Promise.all([
            fetch(`${API_URL}/eventos/ativo?_t=${ts}`, { headers: getAuthHeaders() }), 
            fetch(`${API_URL}/apostas/todas?_t=${ts}`, { headers: getAuthHeaders() }),
            fetch(`${API_URL}/usuarios?_t=${ts}`, { headers: getAuthHeaders() })
        ]);

        if (resumoRes.ok) {
            const data = await resumoRes.json();
            resumoAtual = data.evento || data;
            estatisticasAtual = data.estatisticas || null;
        }

        if (dadosRes.ok) {
            const dadosCompletos = await dadosRes.json();
            // Suporta tanto array direto quanto objeto { apostas: [] }
            apostasAtual = dadosCompletos.apostas || (Array.isArray(dadosCompletos) ? dadosCompletos : []);
        }

        if (usuariosRes.ok) {
            const usuariosData = await usuariosRes.json();
            usuariosLista = usuariosData.usuarios || (Array.isArray(usuariosData) ? usuariosData : []);
        }

        atualizarInterface();
    } catch (error) {
        console.error("Erro na sincronia:", error);
    }
}

// ==========================================
// 🎨 CORE: Renderização da Interface
// ==========================================
function atualizarInterface() {
    if (!resumoAtual || !resumoAtual.id) {
        const statusSection = document.getElementById('statusSection');
        if (statusSection) {
            statusSection.innerHTML = `
                <div style="background: #fef3c7; color: #92400e; padding: 20px; border-radius: 8px; border: 2px dashed #fbbf24; width: 100%; text-align: center; font-size: 1.1em;">
                    ⚠️ O banco de dados está vazio ou não há evento ativo. <br><br> Clique no botão <b>"Novo Evento"</b> para adicionar os times e começar!
                </div>`;
        }
        return; 
    }

    atualizarStatus();
    atualizarApostas();
    atualizarUsuarios();
    atualizarVencedor();
}

function atualizarStatus() {
    const estaAberto = resumoAtual.status === 'aberto' || resumoAtual.aberto === true;
    
    let totalGeral = 0;
    if (estatisticasAtual && estatisticasAtual.totalArrecadado !== undefined) {
        totalGeral = estatisticasAtual.totalArrecadado;
    } else if (resumoAtual.totalGeral) {
        totalGeral = resumoAtual.totalGeral;
    }

    const taxaPlataforma = totalGeral * 0.05;
    const totalPremio = totalGeral - taxaPlataforma;

    document.getElementById('statusSection').innerHTML = `
        <div class="stat-card blue">
            <div class="label">Status</div>
            <div class="value">${estaAberto ? '🟢' : '🔴'}</div>
            <div class="label">${estaAberto ? 'Aberto' : 'Fechado'}</div>
        </div>
        <div class="stat-card green">
            <div class="label">Total Apostado</div>
            <div class="value">R$ ${totalGeral.toFixed(2)}</div>
        </div>
        <div class="stat-card orange">
            <div class="label">Nº de Apostas</div>
            <div class="value">${apostasAtual.length}</div>
        </div>
        <div class="stat-card" style="background: #fef3c7; border: 2px solid #fbbf24;">
            <div class="label">Taxa (5%)</div>
            <div class="value" style="font-size: 1.3em;">R$ ${taxaPlataforma.toFixed(2)}</div>
            <div class="label" style="font-size: 0.85em; margin-top: 5px;">Prêmio Líquido: R$ ${totalPremio.toFixed(2)}</div>
        </div>
    `;

    const btnAbrir = document.getElementById('btnAbrir');
    const btnFechar = document.getElementById('btnFechar');

    if (btnAbrir) btnAbrir.disabled = estaAberto;
    if (btnFechar) btnFechar.disabled = !estaAberto;
}

function atualizarApostas() {
    if (apostasAtual.length === 0) {
        document.getElementById('apostasContainer').innerHTML = `
            <div class="empty-state">
                <div style="font-size: 3em;">📭</div>
                <p>Nenhuma aposta registrada ainda</p>
            </div>
        `;
        return;
    }

    document.getElementById('apostasContainer').innerHTML = apostasAtual.map(aposta => `
        <div class="aposta-item">
            <div class="aposta-info">
                <div class="nome">${aposta.nome || aposta.usuarioId || 'Usuário'}</div>
                <div class="detalhes">${aposta.time} • ${new Date(aposta.timestamp || aposta.criadoEm || Date.now()).toLocaleString('pt-BR')}</div>
            </div>
            <div class="aposta-valor">R$ ${parseFloat(aposta.valor).toFixed(2)}</div>
        </div>
    `).join('');
}

function atualizarUsuarios() {
    if (!usuariosLista || usuariosLista.length === 0) return;

    const usuariosHTML = usuariosLista.map(usuario => {
        const isSuperAdmin = usuario.isSuperAdmin;
        const isAdmin = usuario.isAdmin && !isSuperAdmin;
        const isUsuarioComum = !usuario.isAdmin;

        let badge = isSuperAdmin ? 'SUPER ADMIN' : isAdmin ? 'ADMIN' : 'USUÁRIO';
        let badgeColor = isSuperAdmin ? 'background: #dc2626; color: white;' : isAdmin ? 'background: #fbbf24; color: #78350f;' : 'background: #3b82f6; color: white;';
        let acoesHTML = '';

        if (isUsuarioComum) {
            acoesHTML += `<button class="btn btn-success btn-small btn-promover" data-user-id="${usuario.id}" style="padding: 6px 12px; font-size: 0.85em; margin-right: 5px;">⬆️ Promover</button>`;
        }
        if (isAdmin && usuarioLogado && usuarioLogado.isSuperAdmin) {
            acoesHTML += `<button class="btn btn-danger btn-small btn-rebaixar" data-user-id="${usuario.id}" style="padding: 6px 12px; font-size: 0.85em;">⬇️ Rebaixar</button>`;
        }

        return `
            <div class="aposta-item" style="align-items: center;">
                <div class="aposta-info" style="flex: 1;">
                    <div class="nome">${usuario.nome}<span style="${badgeColor} padding: 2px 8px; border-radius: 10px; font-size: 0.75em; margin-left: 8px;">${badge}</span></div>
                    <div class="detalhes">${usuario.email}</div>
                </div>
                <div style="display: flex; gap: 5px;">${acoesHTML || '<span style="color: #999; font-size: 0.9em;">Sem ações</span>'}</div>
            </div>
        `;
    }).join('');

    document.getElementById('usuariosContainer').innerHTML = `<div style="margin-bottom: 15px;">${usuariosHTML}</div>`;
}

function atualizarVencedor() {
    const alert = document.getElementById('vencedorAlert');
    const estaAberto = resumoAtual.status === 'aberto' || resumoAtual.aberto === true;

    if (estaAberto) {
        if(alert) { alert.style.display = 'block'; alert.className = 'alert alert-warning'; alert.textContent = '⚠️ Feche as apostas antes de definir o vencedor'; }
        document.getElementById('vencedorSection').innerHTML = '';
        return;
    }

    if (resumoAtual.vencedor && alert) {
        alert.style.display = 'block'; alert.className = 'alert alert-success'; alert.textContent = `🏆 Vencedor definido: ${resumoAtual.vencedor}`;
    } else if (alert) {
        alert.style.display = 'none';
    }

    const timesArray = Array.isArray(resumoAtual.times) ? resumoAtual.times : Object.keys(resumoAtual.times || {});
    
    document.getElementById('vencedorSection').innerHTML = timesArray.map(time => {
        let percentual = 0;
        if (estatisticasAtual && estatisticasAtual.totalArrecadado > 0) {
            percentual = ((estatisticasAtual.totalPorTime[time] || 0) / estatisticasAtual.totalArrecadado) * 100;
        }

        return `
        <div class="vencedor-btn ${resumoAtual.vencedor === time ? 'selected' : ''}" data-time="${time}">
            ${time}<div style="font-size: 0.85em; margin-top: 5px;">${percentual.toFixed(1)}%</div>
        </div>
        `;
    }).join('');

    document.querySelectorAll('.vencedor-btn').forEach(btn => {
        btn.onclick = (e) => { e.preventDefault(); definirVencedor(btn.dataset.time); };
    });
}

// ==========================================
// 🚀 CORE: Ações de Mutação (POST)
// ==========================================

// Função Adicionada: Gestão de Usuários
async function alterarPermissaoUsuario(id, acao) {
    if (!confirm(`Tem certeza que deseja ${acao} este usuário?`)) return;
    try {
        const response = await fetch(`${API_URL}/usuarios/${id}/${acao}`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        
        let data = {}; try { data = await response.json(); } catch(e){}

        if (response.ok) {
            mostrarAlerta(`✅ Usuário ${acao === 'promover' ? 'promovido' : 'rebaixado'} com sucesso!`);
            await carregarDados();
        } else {
            mostrarAlerta(extrairErro(data), 'error');
        }
    } catch (err) {
        mostrarAlerta('Erro de conexão com o servidor', 'error');
    }
}

async function alterarStatusApostas(abrir) {
    try {
        const response = await fetch(`${API_URL}/eventos/ativo/apostas`, { 
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ abrir })
        });
        
        let data = {}; try { data = await response.json(); } catch(e){}

        if (response.ok) {
            mostrarAlerta(`✅ Apostas ${abrir ? 'Abertas' : 'Fechadas'} com sucesso!`, 'success');
            await carregarDados();
        } else {
            mostrarAlerta(extrairErro(data), 'error');
        }
    } catch (error) { mostrarAlerta('Erro de conexão com o servidor', 'error'); }
}

async function definirVencedor(time) {
    if (!confirm(`Confirmar ${time} como vencedor final?`)) return;
    try {
        const response = await fetch(`${API_URL}/eventos/ativo/vencedor`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ timeVencedor: time })
        });
        
        let data = {}; try { data = await response.json(); } catch(e){}

        if (response.ok) { 
            mostrarAlerta(`🏆 Vencedor definido!`, 'success'); 
            await carregarDados(); 
        } else {
            mostrarAlerta(extrairErro(data), 'error');
        }
    } catch (error) { mostrarAlerta('Erro de conexão', 'error');}
}

async function resetarEvento() {
    if (!confirm('🚨 ATENÇÃO: Isso irá arquivar o evento atual e criar um novo.')) return;

    const nome = prompt('Digite o nome do novo evento:', 'Rodada 01');
    if (!nome) return;

    const timesInput = prompt('Digite os times separados por vírgula:', 'Time A, Time B');
    if (!timesInput) return;

    const times = timesInput.split(',').map(t => t.trim()).filter(t => t.length > 0);

    try {
        const response = await fetch(`${API_URL}/eventos/resetar`, { 
            method: 'POST', 
            headers: getAuthHeaders(),
            body: JSON.stringify({ nome, times })
        });

        const data = await response.json();

        if (response.ok) { 
            mostrarAlerta('✅ Novo evento criado com sucesso!', 'success'); 
            await carregarDados(); 
        } else {
            mostrarAlerta(extrairErro(data), 'error');
        }
    } catch (error) { 
        mostrarAlerta('Erro de conexão com o servidor', 'error'); 
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const attachClick = (id, fn) => {
        const el = document.getElementById(id);
        if (el) el.onclick = (e) => { e.preventDefault(); fn(); };
    };

    attachClick('btnLogout', logout);
    attachClick('btnAtualizar', carregarDados);
    attachClick('btnAbrir', () => alterarStatusApostas(true));
    attachClick('btnFechar', () => {
        if (confirm('Deseja fechar as apostas? Ninguém mais poderá apostar.')) alterarStatusApostas(false);
    });
    attachClick('btnReset', resetarEvento);

    // Event Delegation para botões criados dinamicamente (Promover/Rebaixar)
    const usuariosContainer = document.getElementById('usuariosContainer');
    if (usuariosContainer) {
        usuariosContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-promover')) {
                alterarPermissaoUsuario(e.target.dataset.userId, 'promover');
            } else if (e.target.classList.contains('btn-rebaixar')) {
                alterarPermissaoUsuario(e.target.dataset.userId, 'rebaixar');
            }
        });
    }

    verificarAuth();
    carregarDados();
    setInterval(carregarDados, 15000);
});