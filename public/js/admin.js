const API_URL = '';
let resumoAtual = null;
let apostasAtual = [];
let usuariosLista = [];
let usuarioLogado = null;

async function verificarAuth() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json' 
            }
        });

        if (response.ok) {
            const data = await response.json();
            usuarioLogado = data.user || data.usuario || data;

            if (!usuarioLogado || (!usuarioLogado.isAdmin && !usuarioLogado.isSuperAdmin)) {
                mostrarAlerta('Acesso negado. Apenas administradores podem acessar esta página.', 'error');
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
    try { 
        await fetch(`${API_URL}/auth/logout`, { 
            method: 'POST',
            headers: { 'Accept': 'application/json' }
        }); 
    } catch (error) {}
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login';
}

async function carregarDados() {
    try {
        const [resumoRes, dadosRes, usuariosRes] = await Promise.all([
            fetch(`${API_URL}/eventos/ativo`, { headers: { 'Accept': 'application/json' } }), 
            fetch(`${API_URL}/dados`, { headers: { 'Accept': 'application/json' } }),
            fetch(`${API_URL}/usuarios`, { headers: { 'Accept': 'application/json' } })
        ]);

        if (resumoRes.status === 404) {
            const resumoLegacy = await fetch(`${API_URL}/resumo`, { headers: { 'Accept': 'application/json' } });
            if (resumoLegacy.ok) resumoAtual = await resumoLegacy.json();
        } else if (resumoRes.ok) {
            const data = await resumoRes.json();
            resumoAtual = data.evento || data;
        }

        if (dadosRes.ok) {
            const dadosCompletos = await dadosRes.json();
            apostasAtual = dadosCompletos.apostas || [];
            // Fallback caso /eventos/ativo falhe mas /dados funcione (rota legada)
            if (!resumoAtual && dadosCompletos.evento) {
                resumoAtual = dadosCompletos.evento;
            }
        }

        if (usuariosRes.ok) {
            const usuariosData = await usuariosRes.json();
            usuariosLista = usuariosData.usuarios || usuariosData;
        }

        atualizarInterface();
    } catch (error) {
        console.error(error);
        mostrarAlerta('Erro ao carregar dados do servidor', 'error');
    }
}

function atualizarInterface() {
    // Se não houver evento, avisa o Admin visualmente na tela
    if (!resumoAtual) {
        const statusSection = document.getElementById('statusSection');
        if (statusSection) {
            statusSection.innerHTML = `
                <div style="background: #fef3c7; color: #92400e; padding: 20px; border-radius: 8px; border: 2px dashed #fbbf24; width: 100%; text-align: center; font-size: 1.1em;">
                    ⚠️ O banco de dados está vazio. <br><br> Nenhum evento ativo no momento. Clique no botão <b>"Novo Evento"</b> ou <b>"Reset"</b> para criar o primeiro evento e começar!
                </div>`;
        }
        return; // Interrompe a atualização do resto pois não há dados
    }

    atualizarStatus();
    atualizarApostas();
    atualizarUsuarios();
    atualizarVencedor();
}

function atualizarStatus() {
    const estaAberto = resumoAtual.status === 'aberto' || resumoAtual.aberto === true;
    
    const statusHTML = `
        <div class="stat-card blue">
            <div class="label">Status</div>
            <div class="value">${estaAberto ? '🟢' : '🔴'}</div>
            <div class="label">${estaAberto ? 'Aberto' : 'Fechado'}</div>
        </div>
        <div class="stat-card green">
            <div class="label">Total Apostado</div>
            <div class="value">R$ ${(resumoAtual.totalGeral || 0).toFixed(2)}</div>
        </div>
        <div class="stat-card orange">
            <div class="label">Nº de Apostas</div>
            <div class="value">${apostasAtual.length}</div>
        </div>
        <div class="stat-card" style="background: #fef3c7; border: 2px solid #fbbf24;">
            <div class="label">Taxa (${resumoAtual.percentualTaxa || 5}%)</div>
            <div class="value" style="font-size: 1.3em;">R$ ${(resumoAtual.taxaPlataforma || 0).toFixed(2)}</div>
            <div class="label" style="font-size: 0.85em; margin-top: 5px;">Prêmio: R$ ${(resumoAtual.totalPremio || 0).toFixed(2)}</div>
        </div>
    `;
    document.getElementById('statusSection').innerHTML = statusHTML;

    const btnAbrir = document.getElementById('btnAbrir') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Abrir'));
    const btnFechar = document.getElementById('btnFechar') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Fechar'));

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

    const apostasHTML = apostasAtual.map(aposta => `
        <div class="aposta-item">
            <div class="aposta-info">
                <div class="nome">${aposta.nome || 'Usuário'}</div>
                <div class="detalhes">${aposta.time} • ${new Date(aposta.timestamp || aposta.criadoEm).toLocaleString('pt-BR')}</div>
            </div>
            <div class="aposta-valor">R$ ${parseFloat(aposta.valor).toFixed(2)}</div>
        </div>
    `).join('');

    document.getElementById('apostasContainer').innerHTML = apostasHTML;
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
            acoesHTML += `<button class="btn btn-success btn-small btn-promover" data-user-id="${usuario.id}" data-user-nome="${usuario.nome}" style="padding: 6px 12px; font-size: 0.85em; margin-right: 5px;">⬆️ Promover</button>`;
        }

        if (isAdmin && usuarioLogado && usuarioLogado.isSuperAdmin) {
            acoesHTML += `<button class="btn btn-danger btn-small btn-rebaixar" data-user-id="${usuario.id}" data-user-nome="${usuario.nome}" style="padding: 6px 12px; font-size: 0.85em;">⬇️ Rebaixar</button>`;
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

    document.querySelectorAll('.btn-promover').forEach(btn => {
        btn.onclick = (e) => { e.preventDefault(); promoverUsuario(btn.dataset.userId, btn.dataset.userNome); };
    });

    document.querySelectorAll('.btn-rebaixar').forEach(btn => {
        btn.onclick = (e) => { e.preventDefault(); rebaixarUsuario(btn.dataset.userId, btn.dataset.userNome); };
    });
}

async function promoverUsuario(userId, nome) {
    if (!confirm(`Promover ${nome} a Administrador?`)) return;
    try {
        const response = await fetch(`${API_URL}/usuarios/${userId}/promover`, { 
            method: 'POST', 
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            } 
        });
        
        let data = {}; try { data = await response.json(); } catch(e){}
        
        if (response.ok) { 
            mostrarAlerta(`✅ Usuário promovido com sucesso!`, 'success'); 
            await carregarDados(); 
        } else {
            mostrarAlerta(data.erro || data.error || 'Erro ao promover usuário', 'error');
        }
    } catch (error) { mostrarAlerta('Erro de conexão', 'error'); }
}

async function rebaixarUsuario(userId, nome) {
    if (!confirm(`Rebaixar ${nome} para Usuário Comum?`)) return;
    try {
        const response = await fetch(`${API_URL}/usuarios/${userId}/rebaixar`, { 
            method: 'POST', 
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            } 
        });
        
        let data = {}; try { data = await response.json(); } catch(e){}

        if (response.ok) { 
            mostrarAlerta(`✅ Usuário rebaixado com sucesso!`, 'success'); 
            await carregarDados(); 
        } else {
            mostrarAlerta(data.erro || data.error || 'Erro ao rebaixar usuário', 'error');
        }
    } catch (error) { mostrarAlerta('Erro de conexão', 'error'); }
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

    const times = resumoAtual.times || {};
    const vencedorHTML = Object.keys(times).map(time => `
        <div class="vencedor-btn ${resumoAtual.vencedor === time ? 'selected' : ''}" data-time="${time}">
            ${time}<div style="font-size: 0.85em; margin-top: 5px;">${(times[time].percentual || 0)}%</div>
        </div>
    `).join('');

    document.getElementById('vencedorSection').innerHTML = vencedorHTML;

    document.querySelectorAll('.vencedor-btn').forEach(btn => {
        btn.onclick = (e) => { e.preventDefault(); definirVencedor(btn.dataset.time); };
    });
}

function mostrarAlerta(mensagem, tipo = 'success') {
    const alertContainer = document.getElementById('alertContainer');
    if(alertContainer) {
        alertContainer.innerHTML = `<div class="alert alert-${tipo}">${mensagem}</div>`;
        setTimeout(() => { alertContainer.innerHTML = ''; }, 5000);
    } else {
        alert(mensagem);
    }
}

async function abrirApostas() {
    try {
        const response = await fetch(`${API_URL}/evento/abrir-fechar`, { 
            method: 'POST', 
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json' // OBRIGATÓRIO: Força erro JSON se barrado pelo auth
            } 
        });
        
        let data = {}; try { data = await response.json(); } catch(e){}

        if (response.ok) {
            mostrarAlerta('✅ Status alterado com sucesso!', 'success');
            await carregarDados();
        } else {
            // Agora ele mostra o erro exato caso não esteja autorizado
            mostrarAlerta(data.erro || data.error || 'Erro ao alterar status', 'error');
        }
    } catch (error) { mostrarAlerta('Erro de conexão com o servidor', 'error'); }
}

async function fecharApostas() {
    if (!confirm('Deseja fechar as apostas?')) return;
    abrirApostas(); 
}

async function definirVencedor(time) {
    if (!confirm(`Confirmar ${time} como vencedor?`)) return;
    try {
        const response = await fetch(`${API_URL}/vencedor`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ time })
        });
        
        let data = {}; try { data = await response.json(); } catch(e){}

        if (response.ok) { 
            mostrarAlerta(`🏆 Vencedor definido!`, 'success'); 
            await carregarDados(); 
        } else {
            mostrarAlerta(data.erro || data.error || 'Erro ao definir vencedor', 'error');
        }
    } catch (error) { mostrarAlerta('Erro de conexão', 'error');}
}

async function resetarEvento() {
    if (!confirm('🚨 ATENÇÃO: Deseja criar um NOVO EVENTO? Isso irá arquivar o atual e apagar as apostas da tela.')) return;
    try {
        const response = await fetch(`${API_URL}/reset`, { 
            method: 'POST', 
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            } 
        });

        let data = {}; try { data = await response.json(); } catch(e){}

        if (response.ok) { 
            mostrarAlerta('🔄 Novo evento criado com sucesso!', 'success'); 
            await carregarDados(); 
        } else {
            mostrarAlerta(data.erro || data.error || 'Erro ao criar novo evento', 'error');
        }
    } catch (error) { mostrarAlerta('Erro de conexão', 'error'); }
}

document.addEventListener('DOMContentLoaded', () => {
    const btnLogout = document.getElementById('btnLogout');
    const btnAtualizar = document.getElementById('btnAtualizar');

    if (btnLogout) btnLogout.onclick = (e) => { e.preventDefault(); logout(); };
    if (btnAtualizar) btnAtualizar.onclick = (e) => { e.preventDefault(); carregarDados(); };

    const btnAbrir = document.getElementById('btnAbrir') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Abrir'));
    const btnFechar = document.getElementById('btnFechar') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Fechar'));
    const btnReset = document.getElementById('btnReset') || document.getElementById('btnNovoEvento') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Novo Evento') || b.textContent.includes('Reset'));

    if (btnAbrir) btnAbrir.onclick = (e) => { e.preventDefault(); abrirApostas(); };
    if (btnFechar) btnFechar.onclick = (e) => { e.preventDefault(); fecharApostas(); };
    if (btnReset) btnReset.onclick = (e) => { e.preventDefault(); resetarEvento(); };

    verificarAuth();
    carregarDados();
    setInterval(carregarDados, 10000);
});