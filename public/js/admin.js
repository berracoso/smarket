const API_URL = '';
let resumoAtual = null;
let apostasAtual = [];
let usuariosLista = [];
let usuarioLogado = null;

// Verificar autenticação de admin
async function verificarAuth() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            usuarioLogado = data.usuario;

            if (!usuarioLogado.isAdmin) {
                // Usar Flash Message se disponível
                if (window.showError) {
                    window.showError('Acesso negado. Apenas administradores podem acessar esta página.', 3000);
                }
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            }
        } else {
            window.location.href = '/login';
        }
    } catch (error) {
        window.location.href = '/login';
    }
}

// Logout
async function logout() {
    try {
        await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        window.location.href = '/login';
    } catch (error) {
        window.location.href = '/login';
    }
}

// Carregar todos os dados
async function carregarDados() {
    try {
        const [resumoRes, dadosRes, usuariosRes] = await Promise.all([
            fetch(`${API_URL}/resumo`, { credentials: 'include' }),
            fetch(`${API_URL}/dados`, { credentials: 'include' }),
            fetch(`${API_URL}/usuarios`, { credentials: 'include' })
        ]);

        resumoAtual = await resumoRes.json();
        const dadosCompletos = await dadosRes.json();
        apostasAtual = dadosCompletos.apostas || [];

        if (usuariosRes.ok) {
            const usuariosData = await usuariosRes.json();
            usuariosLista = usuariosData.usuarios;
        }

        atualizarInterface();
    } catch (error) {
        mostrarAlerta('Erro ao carregar dados', 'error');
    }
}

// Atualizar interface
function atualizarInterface() {
    atualizarStatus();
    atualizarApostas();
    atualizarUsuarios();
    atualizarVencedor();
}

// Atualizar seção de status
function atualizarStatus() {
    const statusHTML = `
        <div class="stat-card blue">
            <div class="label">Status</div>
            <div class="value">${resumoAtual.aberto ? '🟢' : '🔴'}</div>
            <div class="label">${resumoAtual.aberto ? 'Aberto' : 'Fechado'}</div>
        </div>
        <div class="stat-card green">
            <div class="label">Total Apostado</div>
            <div class="value">R$ ${resumoAtual.totalGeral.toFixed(2)}</div>
        </div>
        <div class="stat-card orange">
            <div class="label">Nº de Apostas</div>
            <div class="value">${apostasAtual.length}</div>
        </div>
        <div class="stat-card" style="background: #fef3c7; border: 2px solid #fbbf24;">
            <div class="label">Taxa (${resumoAtual.percentualTaxa}%)</div>
            <div class="value" style="font-size: 1.3em;">R$ ${resumoAtual.taxaPlataforma.toFixed(2)}</div>
            <div class="label" style="font-size: 0.85em; margin-top: 5px;">Prêmio: R$ ${resumoAtual.totalPremio.toFixed(2)}</div>
        </div>
    `;
    document.getElementById('statusSection').innerHTML = statusHTML;

    // Atualizar botões
    document.getElementById('btnAbrir').disabled = resumoAtual.aberto;
    document.getElementById('btnFechar').disabled = !resumoAtual.aberto;
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
                <div class="nome">${aposta.nome}</div>
                <div class="detalhes">
                    ${aposta.time} • ${new Date(aposta.timestamp).toLocaleString('pt-BR')}
                </div>
            </div>
            <div class="aposta-valor">R$ ${aposta.valor.toFixed(2)}</div>
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

        // Botão de promover (apenas para usuários comuns)
        if (isUsuarioComum) {
            acoesHTML += `<button class="btn btn-success btn-small btn-promover" data-user-id="${usuario.id}" data-user-nome="${usuario.nome}" style="padding: 6px 12px; font-size: 0.85em; margin-right: 5px;">⬆️ Promover</button>`;
        }

        // Botão de rebaixar (apenas para admins promovidos e apenas se usuário logado for Super Admin)
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

    // Adicionar event listeners para botões de promover
    document.querySelectorAll('.btn-promover').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = btn.dataset.userId;
            const nome = btn.dataset.userNome;
            promoverUsuario(userId, nome);
        });
    });

    // Adicionar event listeners para botões de rebaixar
    document.querySelectorAll('.btn-rebaixar').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = btn.dataset.userId;
            const nome = btn.dataset.userNome;
            rebaixarUsuario(userId, nome);
        });
    });
}

// Promover usuário a admin
async function promoverUsuario(userId, nome) {
    const confirmado = await showConfirm(
        `Promover <strong>${nome}</strong> a Administrador?<br><br>Ele poderá acessar o painel admin e continuar apostando normalmente.`,
        {
            title: 'Promover Usuário',
            confirmText: 'Promover',
            type: 'info',
            icon: '👑'
        }
    );

    if (!confirmado) return;

    try {
        const response = await fetch(`${API_URL}/usuarios/${userId}/promover`, {
            method: 'POST',
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            mostrarAlerta(`✅ ${data.mensagem}`, 'success');
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
    const confirmado = await confirmWarning(
        `Rebaixar <strong>${nome}</strong> de Administrador para Usuário Comum?<br><br>Ele perderá acesso ao painel admin, mas poderá continuar apostando.`,
        {
            title: '⚠️ Rebaixar Administrador',
            confirmText: 'Rebaixar',
            cancelText: 'Cancelar'
        }
    );

    if (!confirmado) return;

    try {
        const response = await fetch(`${API_URL}/usuarios/${userId}/rebaixar`, {
            method: 'POST',
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            mostrarAlerta(`✅ ${data.mensagem}`, 'success');
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

    if (resumoAtual.aberto) {
        alert.style.display = 'block';
        alert.className = 'alert alert-warning';
        alert.textContent = '⚠️ Feche as apostas antes de definir o vencedor';
        document.getElementById('vencedorSection').innerHTML = '';
        return;
    }

    if (resumoAtual.vencedor) {
        alert.style.display = 'block';
        alert.className = 'alert alert-success';
        alert.textContent = `🏆 Vencedor definido: ${resumoAtual.vencedor}`;
    } else {
        alert.style.display = 'none';
    }

    const vencedorHTML = Object.keys(resumoAtual.times).map(time => `
        <div class="vencedor-btn ${resumoAtual.vencedor === time ? 'selected' : ''}" 
             data-time="${time}">
            ${time}
            <div style="font-size: 0.85em; margin-top: 5px;">
                ${resumoAtual.times[time].percentual}%
            </div>
        </div>
    `).join('');

    document.getElementById('vencedorSection').innerHTML = vencedorHTML;

    // Adicionar event listeners para botões de vencedor
    document.querySelectorAll('.vencedor-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const time = btn.dataset.time;
            definirVencedor(time);
        });
    });
}

// Mostrar alerta usando Flash Message
function mostrarAlerta(mensagem, tipo = 'success') {
    // Mapear tipos para o Flash Message
    const tipoMap = {
        'success': 'success',
        'error': 'error',
        'warning': 'warning',
        'info': 'info'
    };

    const tipoFlash = tipoMap[tipo] || 'info';

    // Usar Flash Message se disponível
    if (window.flashMessage) {
        window.flashMessage.show(mensagem, tipoFlash, 5000);
    } else {
        // Fallback para o sistema antigo se Flash Message não carregou
        const alertHTML = `
            <div class="alert alert-${tipo}">
                ${mensagem}
            </div>
        `;
        document.getElementById('alertContainer').innerHTML = alertHTML;

        setTimeout(() => {
            document.getElementById('alertContainer').innerHTML = '';
        }, 5000);
    }
}

// Abrir apostas
async function abrirApostas() {
    try {
        const response = await fetch(`${API_URL}/evento/abrir-fechar`, {
            method: 'POST',
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            if (data.aberto) {
                mostrarAlerta('✅ Apostas abertas com sucesso!', 'success');
            } else {
                mostrarAlerta('🔒 Apostas fechadas com sucesso!', 'success');
            }
            await carregarDados();
        } else {
            mostrarAlerta(data.erro || 'Erro ao alterar status das apostas', 'error');
        }
    } catch (error) {
        mostrarAlerta('Erro ao conectar com servidor', 'error');
    }
}

// Fechar apostas (usa a mesma rota)
async function fecharApostas() {
    const confirmado = await confirmWarning(
        'Após fechar as apostas, os usuários não poderão mais apostar.<br><br>Você poderá reabri-las depois, se necessário.',
        {
            title: '🔒 Fechar Apostas',
            confirmText: 'Fechar Apostas',
            cancelText: 'Cancelar'
        }
    );

    if (!confirmado) return;

    try {
        const response = await fetch(`${API_URL}/evento/abrir-fechar`, {
            method: 'POST',
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            if (!data.aberto) {
                mostrarAlerta('🔒 Apostas fechadas com sucesso!', 'success');
            } else {
                mostrarAlerta('✅ Apostas abertas com sucesso!', 'success');
            }
            await carregarDados();
        } else {
            mostrarAlerta(data.erro || 'Erro ao alterar status das apostas', 'error');
        }
    } catch (error) {
        mostrarAlerta('Erro ao conectar com servidor', 'error');
    }
}

// Definir vencedor
async function definirVencedor(time) {
    const confirmado = await showConfirm(
        `Confirmar <strong>${time}</strong> como time vencedor?<br><br>Esta ação irá calcular os ganhos de todos os apostadores.`,
        {
            title: '🏆 Definir Vencedor',
            confirmText: 'Confirmar Vencedor',
            type: 'success',
            icon: '🏆'
        }
    );

    if (!confirmado) return;

    try {
        const response = await fetch(`${API_URL}/vencedor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ time })
        });

        const data = await response.json();

        if (response.ok) {
            mostrarAlerta(`🏆 ${time} definido como vencedor!`, 'success');
            mostrarResultado(data);
            await carregarDados();
        } else {
            mostrarAlerta(data.erro || 'Erro ao definir vencedor', 'error');
        }
    } catch (error) {
        mostrarAlerta('Erro ao conectar com servidor', 'error');
    }
}

// Mostrar resultado
function mostrarResultado(data) {
    const resultadoHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h3 style="color: #10b981; margin-bottom: 10px;">
                🏆 Vencedor: ${data.vencedor}
            </h3>
            <div style="font-size: 1.2em; color: #666; margin-bottom: 10px;">
                Total Apostado: <strong>R$ ${data.totalGeral.toFixed(2)}</strong>
            </div>
            <div style="font-size: 1em; color: #dc2626; background: #fee2e2; padding: 10px; border-radius: 8px; display: inline-block;">
                💰 Taxa da Plataforma (5%): <strong>R$ ${data.taxaPlataforma.toFixed(2)}</strong>
            </div>
            <div style="font-size: 1.2em; color: #10b981; margin-top: 10px;">
                Prêmio Distribuído: <strong>R$ ${data.totalPremio.toFixed(2)}</strong>
            </div>
        </div>

        <h4 style="margin-bottom: 15px; color: #333;">💰 Vencedores:</h4>
        ${data.vencedores.map(v => `
            <div class="vencedor-item">
                <div class="nome">${v.nome}</div>
                <div class="stats">
                    <div>
                        <div class="label">Apostado</div>
                        <div class="value">R$ ${v.apostado.toFixed(2)}</div>
                    </div>
                    <div>
                        <div class="label">Ganho Total</div>
                        <div class="value" style="color: #10b981;">
                            R$ ${v.ganho.toFixed(2)}
                        </div>
                    </div>
                    <div>
                        <div class="label">Lucro</div>
                        <div class="value" style="color: #3b82f6;">
                            R$ ${v.lucro.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>
        `).join('')}
    `;

    document.getElementById('resultadoContainer').innerHTML = resultadoHTML;
    document.getElementById('resultadoCard').style.display = 'block';
}

// Novo evento
async function resetarEvento() {
    const confirmado = await confirmDanger(
        'Isso irá apagar <strong>TODAS as apostas</strong> e reiniciar o evento do zero.<br><br>Esta ação é <strong>IRREVERSÍVEL</strong>!',
        {
            title: '🚨 ATENÇÃO: Reset Total',
            confirmText: 'Sim, Resetar Tudo',
            cancelText: 'Cancelar'
        }
    );

    if (!confirmado) return;

    try {
        const response = await fetch(`${API_URL}/reset`, {
            method: 'POST',
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            mostrarAlerta('🔄 Evento resetado com sucesso!', 'success');
            document.getElementById('resultadoCard').style.display = 'none';
            await carregarDados();
        } else {
            mostrarAlerta('Erro ao Novo evento', 'error');
        }
    } catch (error) {
        mostrarAlerta('Erro ao conectar com servidor', 'error');
    }
}

// Copiar dados para área de transferência
async function copiarDados() {
    try {
        const response = await fetch(`${API_URL}/dados`);
        const dados = await response.json();
        const dadosTexto = JSON.stringify(dados, null, 2);

        await navigator.clipboard.writeText(dadosTexto);
        mostrarAlerta('📋 Dados copiados para área de transferência!', 'success');
    } catch (error) {
        mostrarAlerta('Erro ao copiar dados', 'error');
    }
}

// Baixar dados como arquivo JSON
async function baixarDados() {
    try {
        const response = await fetch(`${API_URL}/dados`);
        const dados = await response.json();
        const dadosTexto = JSON.stringify(dados, null, 2);

        const blob = new Blob([dadosTexto], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bolao-dados-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        mostrarAlerta('💾 Arquivo JSON baixado!', 'success');
    } catch (error) {
        mostrarAlerta('Erro ao baixar dados', 'error');
    }
}

// Atualizar visualização dos dados
async function atualizarDadosVisualizacao() {
    try {
        const response = await fetch(`${API_URL}/dados`);
        const dados = await response.json();

        const dadosHTML = `<pre>${JSON.stringify(dados, null, 2)}</pre>`;
        document.getElementById('dadosContainer').innerHTML = dadosHTML;
    } catch (error) {
        document.getElementById('dadosContainer').innerHTML =
            '<pre style="color: red;">Erro ao carregar dados</pre>';
    }
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Botões de ação
    const btnLogout = document.getElementById('btnLogout');
    const btnAbrir = document.getElementById('btnAbrir');
    const btnFechar = document.getElementById('btnFechar');
    const btnReset = document.getElementById('btnReset');
    const btnAtualizar = document.getElementById('btnAtualizar');
    const btnCopiar = document.getElementById('btnCopiar');
    const btnBaixar = document.getElementById('btnBaixar');

    if (btnLogout) btnLogout.addEventListener('click', logout);
    if (btnAbrir) btnAbrir.addEventListener('click', abrirApostas);
    if (btnFechar) btnFechar.addEventListener('click', fecharApostas);
    if (btnReset) btnReset.addEventListener('click', resetarEvento);
    if (btnAtualizar) btnAtualizar.addEventListener('click', carregarDados);
    if (btnCopiar) btnCopiar.addEventListener('click', copiarDados);
    if (btnBaixar) btnBaixar.addEventListener('click', baixarDados);

    // Carregar dados iniciais
    verificarAuth();
    carregarDados();
    atualizarDadosVisualizacao();

    // Atualizar a cada 5 segundos
    setInterval(carregarDados, 5000);
    setInterval(atualizarDadosVisualizacao, 5000);
});

