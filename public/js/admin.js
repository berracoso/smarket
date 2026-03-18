const API_URL = '';
let resumoAtual = null;
let apostasAtual = [];
let usuariosLista = [];
let usuarioLogado = null;

// Verificar autenticação de admin (Corrigido para nova arquitetura de Sessão)
async function verificarAuth() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            const data = await response.json();
            
            // CORREÇÃO CRÍTICA: Pega o objeto do usuário independente do formato do backend
            usuarioLogado = data.user || data.usuario || data;

            // Verifica se é admin ou superadmin
            if (!usuarioLogado || (!usuarioLogado.isAdmin && !usuarioLogado.isSuperAdmin)) {
                mostrarAlerta('Acesso negado. Apenas administradores podem acessar esta página.', 'error');
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            }
        } else {
            window.location.href = '/login';
        }
    } catch (error) {
        console.error("Erro ao verificar sessão admin:", error);
        window.location.href = '/login';
    }
}

// Logout (Corrigido para destruir a sessão no backend)
async function logout() {
    try {
        await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error("Erro no logout:", error);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login';
}

// Carregar todos os dados
async function carregarDados() {
    try {
        const [resumoRes, dadosRes, usuariosRes] = await Promise.all([
            fetch(`${API_URL}/eventos/ativo`), // Rota atualizada se aplicável
            fetch(`${API_URL}/dados`),
            fetch(`${API_URL}/usuarios`)
        ]);

        // Fallback caso a rota antiga /resumo ainda seja usada
        if (resumoRes.status === 404) {
            const resumoLegacy = await fetch(`${API_URL}/resumo`);
            resumoAtual = await resumoLegacy.json();
        } else {
            const data = await resumoRes.json();
            resumoAtual = data.evento || data;
        }

        if (dadosRes.ok) {
            const dadosCompletos = await dadosRes.json();
            apostasAtual = dadosCompletos.apostas || [];
        }

        if (usuariosRes.ok) {
            const usuariosData = await usuariosRes.json();
            usuariosLista = usuariosData.usuarios || usuariosData;
        }

        atualizarInterface();
    } catch (error) {
        console.error(error);
        mostrarAlerta('Erro ao carregar dados', 'error');
    }
}

// Atualizar interface
function atualizarInterface() {
    if (!resumoAtual) return;
    atualizarStatus();
    atualizarApostas();
    atualizarUsuarios();
    atualizarVencedor();
}

// Atualizar seção de status
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

    // Atualizar botões
    const btnAbrir = document.getElementById('btnAbrir');
    const btnFechar = document.getElementById('btnFechar');
    if (btnAbrir) btnAbrir.disabled = estaAberto;
    if (btnFechar) btnFechar.disabled = !estaAberto;
}

// Atualizar lista de apostas
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
                <div class="detalhes">
                    ${aposta.time} • ${new Date(aposta.timestamp || aposta.criadoEm).toLocaleString('pt-BR')}
                </div>
            </div>
            <div class="aposta-valor">R$ ${parseFloat(aposta.valor).toFixed(2)}</div>
        </div>
    `).join('');

    document.getElementById('apostasContainer').innerHTML = apostasHTML;
}

// Atualizar seção de usuários
function atualizarUsuarios() {
    if (!usuariosLista || usuariosLista.length === 0) {
        document.getElementById('usuariosContainer').innerHTML = '<p style="text-align: center; color: #999;">Carregando usuários...</p>';
        return;
    }

    const usuariosHTML = usuariosLista.map(usuario => {
        const isSuperAdmin = usuario.isSuperAdmin;
        const isAdmin = usuario.isAdmin && !isSuperAdmin;
        const isUsuarioComum = !usuario.isAdmin;

        let badge = '';
        let badgeColor = '';

        if (isSuperAdmin) {
            badge = 'SUPER ADMIN';
            badgeColor = 'background: #dc2626; color: white;';
        } else if (isAdmin) {
            badge = 'ADMIN';
            badgeColor = 'background: #fbbf24; color: #78350f;';
        } else {
            badge = 'USUÁRIO';
            badgeColor = 'background: #3b82f6; color: white;';
        }

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
                    <div class="nome">
                        ${usuario.nome}
                        <span style="${badgeColor} padding: 2px 8px; border-radius: 10px; font-size: 0.75em; margin-left: 8px;">${badge}</span>
                    </div>
                    <div class="detalhes">${usuario.email}</div>
                </div>
                <div style="display: flex; gap: 5px;">
                    ${acoesHTML || '<span style="color: #999; font-size: 0.9em;">Sem ações</span>'}
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('usuariosContainer').innerHTML = `
        <div style="margin-bottom: 15px;">
            ${usuariosHTML}
        </div>
    `;

    document.querySelectorAll('.btn-promover').forEach(btn => {
        btn.addEventListener('click', () => {
            promoverUsuario(btn.dataset.userId, btn.dataset.userNome);
        });
    });

    document.querySelectorAll('.btn-rebaixar').forEach(btn => {
        btn.addEventListener('click', () => {
            rebaixarUsuario(btn.dataset.userId, btn.dataset.userNome);
        });
    });
}

// Promover usuário a admin
async function promoverUsuario(userId, nome) {
    if (!confirm(`Promover ${nome} a Administrador?`)) return;

    try {
        const response = await fetch(`${API_URL}/usuarios/${userId}/promover`, { method: 'POST' });
        const data = await response.json();

        if (response.ok) {
            mostrarAlerta(`✅ Usuário promovido com sucesso!`, 'success');
            await carregarDados();
        } else {
            mostrarAlerta(data.erro || 'Erro ao promover usuário', 'error');
        }
    } catch (error) {
        mostrarAlerta('Erro ao conectar com servidor', 'error');
    }
}

// Rebaixar admin a usuário comum
async function rebaixarUsuario(userId, nome) {
    if (!confirm(`Rebaixar ${nome} para Usuário Comum?`)) return;

    try {
        const response = await fetch(`${API_URL}/usuarios/${userId}/rebaixar`, { method: 'POST' });
        const data = await response.json();

        if (response.ok) {
            mostrarAlerta(`✅ Usuário rebaixado com sucesso!`, 'success');
            await carregarDados();
        } else {
            mostrarAlerta(data.erro || 'Erro ao rebaixar usuário', 'error');
        }
    } catch (error) {
        mostrarAlerta('Erro ao conectar com servidor', 'error');
    }
}

// Atualizar seção de vencedor
function atualizarVencedor() {
    const alert = document.getElementById('vencedorAlert');
    const estaAberto = resumoAtual.status === 'aberto' || resumoAtual.aberto === true;

    if (estaAberto) {
        if(alert) {
            alert.style.display = 'block';
            alert.className = 'alert alert-warning';
            alert.textContent = '⚠️ Feche as apostas antes de definir o vencedor';
        }
        document.getElementById('vencedorSection').innerHTML = '';
        return;
    }

    if (resumoAtual.vencedor && alert) {
        alert.style.display = 'block';
        alert.className = 'alert alert-success';
        alert.textContent = `🏆 Vencedor definido: ${resumoAtual.vencedor}`;
    } else if (alert) {
        alert.style.display = 'none';
    }

    const times = resumoAtual.times || {};
    const vencedorHTML = Object.keys(times).map(time => `
        <div class="vencedor-btn ${resumoAtual.vencedor === time ? 'selected' : ''}" 
             data-time="${time}">
            ${time}
            <div style="font-size: 0.85em; margin-top: 5px;">
                ${(times[time].percentual || 0)}%
            </div>
        </div>
    `).join('');

    document.getElementById('vencedorSection').innerHTML = vencedorHTML;

    document.querySelectorAll('.vencedor-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            definirVencedor(btn.dataset.time);
        });
    });
}

// Mostrar alerta (Fallback)
function mostrarAlerta(mensagem, tipo = 'success') {
    const alertContainer = document.getElementById('alertContainer');
    if(alertContainer) {
        alertContainer.innerHTML = `
            <div class="alert alert-${tipo}">
                ${mensagem}
            </div>
        `;
        setTimeout(() => { alertContainer.innerHTML = ''; }, 5000);
    } else {
        alert(mensagem);
    }
}

// Abrir apostas
async function abrirApostas() {
    try {
        const response = await fetch(`${API_URL}/evento/abrir-fechar`, { method: 'POST' });
        if (response.ok) {
            mostrarAlerta('✅ Status alterado com sucesso!', 'success');
            await carregarDados();
        } else {
            mostrarAlerta('Erro ao alterar status', 'error');
        }
    } catch (error) {
        mostrarAlerta('Erro de conexão', 'error');
    }
}

// Fechar apostas (Mesma rota no backend)
async function fecharApostas() {
    if (!confirm('Deseja fechar as apostas?')) return;
    abrirApostas(); 
}

// Definir vencedor
async function definirVencedor(time) {
    if (!confirm(`Confirmar ${time} como vencedor?`)) return;

    try {
        const response = await fetch(`${API_URL}/vencedor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ time })
        });
        const data = await response.json();

        if (response.ok) {
            mostrarAlerta(`🏆 Vencedor definido!`, 'success');
            await carregarDados();
        } else {
            mostrarAlerta(data.erro || 'Erro ao definir vencedor', 'error');
        }
    } catch (error) {
        mostrarAlerta('Erro de conexão', 'error');
    }
}

// Novo evento (Reset)
async function resetarEvento() {
    if (!confirm('🚨 ATENÇÃO: Isso apagará todas as apostas! Deseja continuar?')) return;

    try {
        const response = await fetch(`${API_URL}/reset`, { method: 'POST' });
        if (response.ok) {
            mostrarAlerta('🔄 Evento resetado!', 'success');
            await carregarDados();
        } else {
            mostrarAlerta('Erro ao resetar', 'error');
        }
    } catch (error) {
        mostrarAlerta('Erro de conexão', 'error');
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    const btnLogout = document.getElementById('btnLogout');
    const btnAbrir = document.getElementById('btnAbrir');
    const btnFechar = document.getElementById('btnFechar');
    const btnReset = document.getElementById('btnReset');
    const btnAtualizar = document.getElementById('btnAtualizar');

    if (btnLogout) btnLogout.addEventListener('click', logout);
    if (btnAbrir) btnAbrir.addEventListener('click', abrirApostas);
    if (btnFechar) btnFechar.addEventListener('click', fecharApostas);
    if (btnReset) btnReset.addEventListener('click', resetarEvento);
    if (btnAtualizar) btnAtualizar.addEventListener('click', carregarDados);

    verificarAuth();
    carregarDados();
    setInterval(carregarDados, 10000);
});