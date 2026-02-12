const API_URL = '';
let timeSelecionado = null;
let resumoAtual = null;
let usuarioAtual = null;
let paginaAtual = 1;

// Verificar autenticação
async function verificarAuth() {
    try {
        // CORREÇÃO: Removido credentials: 'include' para evitar erro de CORS
        // O token é injetado automaticamente pelo permission-interceptor.js
        const response = await fetch(`${API_URL}/auth/me`);

        if (response.ok) {
            const data = await response.json();
            usuarioAtual = data.usuario;

            // Elementos que precisam ser controlados por permissão
            const menuAdmin = document.getElementById('menuAdmin');
            const apostaCard = document.getElementById('apostaCard');
            const superAdminAlert = document.getElementById('superAdminAlert');
            const superAdminAlertMinhas = document.getElementById('superAdminAlertMinhas');
            const userName = document.getElementById('userName');

            // Resetar estado inicial
            if (menuAdmin) menuAdmin.style.display = 'none';
            if (superAdminAlert) superAdminAlert.style.display = 'none';
            if (superAdminAlertMinhas) superAdminAlertMinhas.style.display = 'none';
            if (apostaCard) apostaCard.style.display = 'block';

            // Configuração de visualização baseada no nível de acesso
            if (usuarioAtual.isAdmin === true) {
                if (menuAdmin) menuAdmin.style.display = 'flex';
            }

            if (usuarioAtual.isSuperAdmin === true) {
                if (apostaCard) apostaCard.style.display = 'none';
                if (superAdminAlert) superAdminAlert.style.display = 'block';
                if (superAdminAlertMinhas) superAdminAlertMinhas.style.display = 'block';
                if (userName) userName.innerHTML = `👤 ${usuarioAtual.nome} <span style="background: #dc2626; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8em; margin-left: 5px;">SUPER ADMIN</span>`;
            } else if (usuarioAtual.isAdmin === true) {
                if (userName) userName.innerHTML = `👤 ${usuarioAtual.nome} <span style="background: #fbbf24; color: #78350f; padding: 2px 8px; border-radius: 10px; font-size: 0.8em; margin-left: 5px;">ADMIN</span>`;
            } else {
                if (userName) userName.innerHTML = `👤 ${usuarioAtual.nome}`;
            }

            carregarConta();
        } else {
            // Se o servidor retornar 401, o interceptor já lida, mas garantimos aqui
            if (response.status === 401 || response.status === 403) {
                console.warn('Falha na autenticação, redirecionando...');
                window.location.href = '/login';
            }
        }
    } catch (error) {
        console.error('Erro de conexão ao verificar auth:', error);
        // CORREÇÃO: Não redirecionar imediatamente em erro de rede genérico,
        // pois pode ser apenas servidor offline momentaneamente.
        // O usuário verá o estado "Carregando..." ou podemos mostrar um alerta.
        mostrarAlerta('Erro de conexão com o servidor.', 'error');
    }
}

// Mostrar seção
function mostrarSecao(secao) {
    document.querySelectorAll('.section-content').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));

    if (secao === 'apostas') {
        document.getElementById('secaoApostas').classList.add('active');
        document.getElementById('menuApostas').classList.add('active');
    } else if (secao === 'minhas-apostas') {
        document.getElementById('secaoMinhasApostas').classList.add('active');
        document.getElementById('menuMinhasApostas').classList.add('active');
        carregarMinhasApostas();
    } else if (secao === 'historico') {
        document.getElementById('secaoHistorico').classList.add('active');
        document.getElementById('menuHistorico').classList.add('active');
        carregarEstatisticas();
        carregarEventosFiltro();
        carregarHistorico();
    } else if (secao === 'conta') {
        document.getElementById('secaoConta').classList.add('active');
        document.getElementById('menuConta').classList.add('active');
    }
}

// Carregar minhas apostas
async function carregarMinhasApostas() {
    try {
        // CORREÇÃO: Removido credentials: 'include'
        const response = await fetch(`${API_URL}/minhas-apostas`);

        if (response.ok) {
            const data = await response.json();

            if (data.apostas.length === 0) {
                document.getElementById('minhasApostasContainer').innerHTML = `
                    <div class="empty-state" style="text-align: center; padding: 40px; color: #999;">
                        <div style="font-size: 3em;">📭</div>
                        <p>Você ainda não fez nenhuma aposta</p>
                    </div>
                `;
                return;
            }

            const apostasHTML = data.apostas.map(aposta => `
                <div class="aposta-card">
                    <div class="time">${aposta.time}</div>
                    <div class="info">
                        <span>Apostado:</span>
                        <span><strong>R$ ${aposta.valor.toFixed(2)}</strong></span>
                    </div>
                    <div class="info">
                        <span>Data:</span>
                        <span>${new Date(aposta.timestamp).toLocaleString('pt-BR')}</span>
                    </div>
                    <div class="retorno">
                        <div class="label">Retorno se vencer (com 5% de taxa descontada)</div>
                        <div class="value">R$ ${aposta.retornoEstimado}</div>
                        <div class="label" style="margin-top: 5px;">Lucro: R$ ${aposta.lucroEstimado}</div>
                    </div>
                </div>
            `).join('');

            const totalHTML = `
                <div style="background: #667eea; color: white; padding: 15px; border-radius: 10px; text-align: center; margin-top: 15px;">
                    <div style="font-size: 0.9em;">Total Apostado</div>
                    <div style="font-size: 1.5em; font-weight: bold; margin-top: 5px;">R$ ${data.valorTotal.toFixed(2)}</div>
                    <div style="font-size: 0.85em; margin-top: 5px;">${data.total} aposta(s)</div>
                </div>
            `;

            document.getElementById('minhasApostasContainer').innerHTML = apostasHTML + totalHTML;
        } else {
            document.getElementById('minhasApostasContainer').innerHTML = '<p style="color: #ef4444; text-align: center;">Erro ao carregar apostas</p>';
        }
    } catch (error) {
        document.getElementById('minhasApostasContainer').innerHTML = '<p style="color: #ef4444; text-align: center;">Erro ao conectar com servidor</p>';
    }
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
        permissoes.push('✅ Gerenciar usuários');
        permissoes.push('✅ Promover e rebaixar administradores');
        permissoes.push('❌ Não pode apostar (conta de gestão)');
    } else if (usuarioAtual.isAdmin) {
        permissoes.push('✅ Acesso ao painel admin');
        permissoes.push('✅ Gerenciar eventos e apostas');
        permissoes.push('✅ Promover usuários');
        permissoes.push('✅ Pode apostar normalmente');
    } else {
        permissoes.push('✅ Fazer apostas');
        permissoes.push('✅ Ver resumo do mercado');
        permissoes.push('✅ Acompanhar suas apostas');
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
    
    const btnLogoutConta = document.querySelector('.btn-logout-conta');
    if (btnLogoutConta) {
        btnLogoutConta.addEventListener('click', logout);
    }
}

// Logout
async function logout() {
    try {
        // Remove token localmente primeiro para evitar race condition
        localStorage.removeItem('token');
        
        // Tenta avisar o servidor (opcional com JWT stateless, mas boa prática)
        await fetch(`${API_URL}/auth/logout`, {
            method: 'POST'
        });
    } catch (error) {
        console.error('Erro no logout', error);
    } finally {
        window.location.href = '/login';
    }
}

// Carregar resumo inicial
async function carregarResumo() {
    try {
        // CORREÇÃO: Removido credentials: 'include'
        const response = await fetch(`${API_URL}/resumo`);
        
        if (!response.ok) return; // Se der erro, apenas ignora para não floodar alertas
        
        resumoAtual = await response.json();
        atualizarInterface();
    } catch (error) {
        console.error('Erro ao carregar resumo', error);
    }
}

// Atualizar interface com dados do resumo
function atualizarInterface() {
    const temTimes = resumoAtual.times && Object.keys(resumoAtual.times).length > 0;

    // Status
    const statusHTML = temTimes
        ? `<span class="status-badge ${resumoAtual.aberto ? 'status-aberto' : 'status-fechado'}">
            ${resumoAtual.aberto ? '✅ Apostas Abertas' : '🔒 Apostas Fechadas'}
           </span>`
        : `<span class="status-badge status-fechado">⚠️ Nenhum Evento Ativo</span>`;
    document.getElementById('statusContainer').innerHTML = statusHTML;

    // Vencedor
    if (resumoAtual.vencedor) {
        const vencedorHTML = `
            <div class="alert alert-info">
                🏆 <strong>Vencedor:</strong> ${resumoAtual.vencedor}
            </div>
        `;
        document.getElementById('vencedorContainer').innerHTML = vencedorHTML;
    } else {
        document.getElementById('vencedorContainer').innerHTML = '';
    }

    // Times
    let timesHTML = '';
    if (temTimes) {
        timesHTML = Object.keys(resumoAtual.times).map(time => {
            const dados = resumoAtual.times[time];
            const selected = timeSelecionado === time ? 'selected' : '';
            return `
                <div class="time-option ${selected}" data-time="${time}">
                    <div class="time-name">${time}</div>
                    <div class="time-prob">${dados.percentual}%</div>
                </div>
            `;
        }).join('');
    } else {
        timesHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div>📭</div>
                <div>Nenhum evento ativo no momento</div>
                <p style="font-size: 0.9em; margin-top: 5px;">Aguarde a abertura de um novo evento</p>
            </div>
        `;
    }
    document.getElementById('timesGrid').innerHTML = timesHTML;

    // Resumo detalhado
    let resumoHTML = '';
    let totalHTML = '';

    if (temTimes) {
        resumoHTML = Object.keys(resumoAtual.times).map(time => {
            const dados = resumoAtual.times[time];
            return `
                <div class="time-stats">
                    <div class="name">${time}</div>
                    <div class="stats">
                        <span>Total: R$ ${dados.total.toFixed(2)}</span>
                        <span>Probabilidade: ${dados.percentual}%</span>
                    </div>
                </div>
            `;
        }).join('');

        totalHTML = `
            <div class="alert alert-info" style="margin-top: 15px;">
                💡 <strong>Taxa da Plataforma:</strong> ${resumoAtual.percentualTaxa}% (R$ ${resumoAtual.taxaPlataforma.toFixed(2)})<br>
                <span style="font-size: 0.9em;">Prêmio líquido a distribuir: R$ ${resumoAtual.totalPremio.toFixed(2)}</span>
            </div>
            <div class="total-geral">
                <div class="label">Total Geral Apostado</div>
                <div class="value">R$ ${resumoAtual.totalGeral.toFixed(2)}</div>
            </div>
        `;
    } else {
        resumoHTML = `
            <div style="text-align: center; padding: 30px; color: #999;">
                <p>Nenhum evento ativo para exibir estatísticas</p>
            </div>
        `;
    }

    document.getElementById('resumoContainer').innerHTML = resumoHTML + totalHTML;

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
    if (!temTimes) {
        btnApostar.disabled = true;
        btnApostar.textContent = 'Sem Evento Ativo';
    } else if (!resumoAtual.aberto) {
        btnApostar.disabled = true;
        btnApostar.textContent = 'Apostas Fechadas';
    } else {
        btnApostar.disabled = false;
        btnApostar.textContent = 'Confirmar Aposta';
    }
}

function calcularRetorno() {
    const valorInput = document.getElementById('valor').value;

    if (!timeSelecionado || !valorInput || valorInput <= 0) {
        document.getElementById('retornoContainer').innerHTML = '';
        return;
    }

    const valor = parseFloat(valorInput);
    const totalGeral = resumoAtual.totalGeral + valor;
    const totalPremio = totalGeral * 0.95; 
    const totalTime = resumoAtual.times[timeSelecionado].total + valor;
    const retorno = (valor / totalTime) * totalPremio;

    const retornoHTML = `
        <div class="retorno-estimado">
            <div class="label">Retorno Estimado se Vencer (já com 5% de taxa)</div>
            <div class="value">R$ ${retorno.toFixed(2)}</div>
            <div class="label" style="margin-top: 5px; font-size: 0.85em;">
                Lucro: R$ ${(retorno - valor).toFixed(2)}
            </div>
        </div>
    `;
    document.getElementById('retornoContainer').innerHTML = retornoHTML;
}

function mostrarAlerta(mensagem, tipo = 'success') {
    const tipoMap = {
        'success': 'success',
        'error': 'error',
        'warning': 'warning',
        'info': 'info'
    };
    const tipoFlash = tipoMap[tipo] || 'info';

    if (window.flashMessage) {
        window.flashMessage.show(mensagem, tipoFlash, 5000);
    } else {
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

// ==================== HISTÓRICO ====================

async function carregarEstatisticas() {
    try {
        // CORREÇÃO: Removido credentials: 'include'
        const response = await fetch(`${API_URL}/minhas-estatisticas`);

        if (response.ok) {
            const data = await response.json();
            const estatisticasHTML = `
                <div class="stat-card stat-card-blue">
                    <div class="stat-value">R$ ${data.totalApostado}</div>
                    <div class="stat-label">Total Apostado</div>
                </div>
                <div class="stat-card stat-card-gray">
                    <div class="stat-value">${data.totalApostas}</div>
                    <div class="stat-label">Total de Apostas</div>
                </div>
                <div class="stat-card stat-card-green">
                    <div class="stat-value">${data.apostasGanhas}</div>
                    <div class="stat-label">Apostas Ganhas</div>
                </div>
                <div class="stat-card stat-card-orange">
                    <div class="stat-value">${data.taxaAcerto}%</div>
                    <div class="stat-label">Taxa de Acerto</div>
                </div>
            `;
            document.getElementById('estatisticasContainer').innerHTML = estatisticasHTML;
        }
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

async function carregarEventosFiltro() {
    try {
        // CORREÇÃO: Removido credentials: 'include'
        const response = await fetch(`${API_URL}/eventos`);

        if (response.ok) {
            const data = await response.json();
            const select = document.getElementById('filtroEvento');
            select.innerHTML = '<option value="">Todos os eventos</option>';

            data.eventos.forEach(evento => {
                const option = document.createElement('option');
                option.value = evento.id;
                option.textContent = `${evento.nome} (${evento.status})`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
    }
}

async function carregarHistorico(pagina = 1) {
    paginaAtual = pagina;
    const dataInicio = document.getElementById('filtroDataInicio').value;
    const dataFim = document.getElementById('filtroDataFim').value;
    const eventoId = document.getElementById('filtroEvento').value;

    let url = `${API_URL}/historico-apostas?pagina=${pagina}&limite=5`;
    if (dataInicio) url += `&dataInicio=${dataInicio}`;
    if (dataFim) url += `&dataFim=${dataFim}`;
    if (eventoId) url += `&eventoId=${eventoId}`;

    try {
        // CORREÇÃO: Removido credentials: 'include'
        const response = await fetch(url);

        if (response.ok) {
            const data = await response.json();

            if (data.apostas.length === 0) {
                document.getElementById('historicoContainer').innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #999;">
                        <div style="font-size: 3em;">📭</div>
                        <p style="margin-top: 15px;">Nenhuma aposta encontrada com os filtros selecionados</p>
                    </div>
                `;
                document.getElementById('paginacaoContainer').innerHTML = '';
                return;
            }

            const apostasHTML = data.apostas.map(aposta => {
                const statusBadge = aposta.eventoStatus === 'finalizado'
                    ? (aposta.ganhou
                        ? '<span style="background: #10b981; color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.85em;">✓ Ganhou</span>'
                        : '<span style="background: #ef4444; color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.85em;">✗ Perdeu</span>')
                    : '<span style="background: #f59e0b; color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.85em;">⏳ Em andamento</span>';

                return `
                    <div style="background: #f9fafb; border-radius: 10px; padding: 20px; margin-bottom: 15px; border-left: 4px solid ${aposta.ganhou ? '#10b981' : '#667eea'};">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <div>
                                <div style="font-weight: bold; font-size: 1.2em; color: #333;">${aposta.time}</div>
                                <div style="font-size: 0.85em; color: #6b7280; margin-top: 5px;">${aposta.eventoNome || 'Evento sem nome'}</div>
                            </div>
                            ${statusBadge}
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 15px;">
                            <div>
                                <div style="font-size: 0.85em; color: #6b7280;">Valor Apostado</div>
                                <div style="font-weight: bold; color: #333;">R$ ${parseFloat(aposta.valor).toFixed(2)}</div>
                            </div>
                            <div>
                                <div style="font-size: 0.85em; color: #6b7280;">Data</div>
                                <div style="font-weight: bold; color: #333;">${new Date(aposta.timestamp).toLocaleDateString('pt-BR')}</div>
                            </div>
                            ${aposta.ganhou ? `
                                <div>
                                    <div style="font-size: 0.85em; color: #6b7280;">Lucro</div>
                                    <div style="font-weight: bold; color: #10b981;">R$ ${aposta.lucroReal}</div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');

            document.getElementById('historicoContainer').innerHTML = apostasHTML;

            if (data.paginacao.totalPaginas > 1) {
                let paginacaoHTML = '';

                if (data.paginacao.paginaAtual > 1) {
                    paginacaoHTML += `<button class="btn btn-secondary btn-paginacao" data-pagina="${data.paginacao.paginaAtual - 1}">← Anterior</button>`;
                }

                paginacaoHTML += `<span style="padding: 10px 20px; background: #f3f4f6; border-radius: 8px;">Página ${data.paginacao.paginaAtual} de ${data.paginacao.totalPaginas}</span>`;

                if (data.paginacao.paginaAtual < data.paginacao.totalPaginas) {
                    paginacaoHTML += `<button class="btn btn-secondary btn-paginacao" data-pagina="${data.paginacao.paginaAtual + 1}">Próxima →</button>`;
                }

                document.getElementById('paginacaoContainer').innerHTML = paginacaoHTML;

                document.querySelectorAll('.btn-paginacao').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const pagina = parseInt(btn.dataset.pagina);
                        carregarHistorico(pagina);
                    });
                });
            } else {
                document.getElementById('paginacaoContainer').innerHTML = '';
            }
        }
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        document.getElementById('historicoContainer').innerHTML = `
            <div style="text-align: center; padding: 40px; color: #ef4444;">
                <div style="font-size: 3em;">⚠️</div>
                <p style="margin-top: 15px;">Erro ao carregar histórico</p>
            </div>
        `;
    }
}

function filtrarHistorico() {
    carregarHistorico(1);
}

document.addEventListener('DOMContentLoaded', () => {
    const menuApostas = document.getElementById('menuApostas');
    const menuMinhasApostas = document.getElementById('menuMinhasApostas');
    const menuHistorico = document.getElementById('menuHistorico');
    const menuConta = document.getElementById('menuConta');
    const menuAdmin = document.getElementById('menuAdmin');
    const btnLogout = document.querySelector('.btn-logout');
    const btnFiltrar = document.getElementById('btnFiltrar');
    const apostaForm = document.getElementById('apostaForm');
    const valorInput = document.getElementById('valor');

    if (menuApostas) menuApostas.addEventListener('click', () => mostrarSecao('apostas'));
    if (menuMinhasApostas) menuMinhasApostas.addEventListener('click', () => mostrarSecao('minhas-apostas'));
    if (menuHistorico) menuHistorico.addEventListener('click', () => mostrarSecao('historico'));
    if (menuConta) menuConta.addEventListener('click', () => mostrarSecao('conta'));
    if (menuAdmin) menuAdmin.addEventListener('click', () => window.location.href = '/admin');
    if (btnLogout) btnLogout.addEventListener('click', logout);
    if (btnFiltrar) btnFiltrar.addEventListener('click', filtrarHistorico);

    if (apostaForm) {
        apostaForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!timeSelecionado) {
                mostrarAlerta('Por favor, selecione um time', 'error');
                return;
            }

            const valor = parseFloat(document.getElementById('valor').value);

            if (!valor || valor <= 0) {
                mostrarAlerta('Por favor, insira um valor válido', 'error');
                return;
            }

            try {
                // CORREÇÃO: Removido credentials: 'include'
                const response = await fetch(`${API_URL}/apostas`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ time: timeSelecionado, valor })
                });

                const data = await response.json();

                if (response.ok) {
                    mostrarAlerta(`✅ Aposta confirmada!`, 'success');
                    await carregarResumo();
                    document.getElementById('apostaForm').reset();
                    timeSelecionado = null;
                    document.getElementById('retornoContainer').innerHTML = '';
                } else {
                    mostrarAlerta(data.erro || 'Erro ao fazer aposta', 'error');
                }
            } catch (error) {
                mostrarAlerta('Erro ao conectar com servidor', 'error');
            }
        });
    }

    if (valorInput) valorInput.addEventListener('input', calcularRetorno);

    (async function inicializar() {
        await verificarAuth();
        carregarResumo();
    })();

    setInterval(carregarResumo, 10000);
});