// ============================================
// SEU JORGE - PAINEL ADMIN
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyBg2LvzNxheXfb_78I9BIqn60DqNAoTLgw",
    authDomain: "seu-jorge-barbearia.firebaseapp.com",
    databaseURL: "https://seu-jorge-barbearia-default-rtdb.firebaseio.com",
    projectId: "seu-jorge-barbearia",
    storageBucket: "seu-jorge-barbearia.firebasestorage.app",
    messagingSenderId: "941746252187",
    appId: "1:941746252187:web:4a3a79dd1d6a8d5967993e"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let servicos = [];
let agendamentos = [];

console.log('✅ admin.js carregado');

// ============================================
// LOGIN
// ============================================
function fazerLogin() {
    const input = document.getElementById('senha-input');
    const erroEl = document.getElementById('login-erro');
    const senha = (input.value || '').trim();

    erroEl.textContent = '';
    console.log('🔵 Tentando login. Senha:', JSON.stringify(senha));

    db.ref('config/admin/senha').once('value')
        .then(snap => {
            const senhaBanco = snap.val();
            const senhaCorreta = (senhaBanco || 'jorge2026').toString().trim();
            console.log('🔵 Senha banco:', JSON.stringify(senhaBanco), '| Usando:', JSON.stringify(senhaCorreta));

            if (senha === senhaCorreta) {
                console.log('🟢 Senha correta');
                sessionStorage.setItem('logado', 'true');
                abrirPainel();
            } else {
                console.warn('🔴 Senha incorreta');
                erroEl.textContent = 'Senha incorreta!';
            }
        })
        .catch(err => {
            console.error('❌ Erro Firebase:', err);
            erroEl.textContent = 'Erro de conexão. Tente novamente.';
        });
}

function fazerLogout() {
    sessionStorage.removeItem('logado');
    location.reload();
}

// Função de TESTE - pula login sem Firebase
function entrarModoTeste() {
    console.log('🧪 Modo teste ativado');
    sessionStorage.setItem('logado', 'true');
    abrirPainel();
}

// ============================================
// ABRIR PAINEL
// ============================================
function abrirPainel() {
    console.log('🔵 abrirPainel iniciada');

    const elLogin = document.getElementById('tela-login');
    const elPainel = document.getElementById('tela-painel');

    console.log('🔵 tela-login existe?', !!elLogin);
    console.log('🔵 tela-painel existe?', !!elPainel);

    if (!elLogin) {
        console.error('❌ tela-login NÃO EXISTE no HTML!');
        return;
    }
    if (!elPainel) {
        console.error('❌ tela-painel NÃO EXISTE no HTML!');
        return;
    }

    elLogin.style.display = 'none';
    elPainel.style.display = 'block';
    console.log('🟢 Painel visível');

    try {
        carregarTudo();
        console.log('🟢 carregarTudo OK');
    } catch (e) {
        console.error('❌ Erro em carregarTudo:', e);
    }
}

// ============================================
// CARREGAR TUDO
// ============================================
function carregarTudo() {
    db.ref('config/servicos').on('value', snap => {
        try {
            servicos = [];
            snap.forEach(child => {
                servicos.push({ id: child.key, ...child.val() });
            });
            renderizarServicosAdmin();
        } catch (e) {
            console.error('❌ Erro serviços:', e);
        }
    }, err => console.error('❌ Firebase serviços:', err));

    db.ref('agendamentos').on('value', snap => {
        try {
            agendamentos = [];
            snap.forEach(child => {
                agendamentos.push({ id: child.key, ...child.val() });
            });
            renderizarAgendamentos();
        } catch (e) {
            console.error('❌ Erro agendamentos:', e);
        }
    }, err => console.error('❌ Firebase agendamentos:', err));

    db.ref('bloqueios').on('value', snap => {
        try {
            renderizarBloqueios(snap.val() || {});
        } catch (e) {
            console.error('❌ Erro bloqueios:', e);
        }
    }, err => console.error('❌ Firebase bloqueios:', err));
}

// ============================================
// AGENDAMENTOS
// ============================================
function renderizarAgendamentos() {
    const container = document.getElementById('lista-agendamentos');
    if (!container) {
        console.error('❌ lista-agendamentos não existe');
        return;
    }

    const hojeStr = new Date().toISOString().split('T')[0];

    const hoje = agendamentos
        .filter(a => a.data === hojeStr)
        .sort((a, b) => (a.horario || '').localeCompare(b.horario || ''));

    const futuros = agendamentos
        .filter(a => a.data > hojeStr)
        .sort((a, b) => ((a.data || '') + (a.horario || '')).localeCompare((b.data || '') + (b.horario || '')));

    if (hoje.length === 0 && futuros.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhum agendamento futuro.</p>';
        return;
    }

    let html = '';

    if (hoje.length > 0) {
        html += `<h5 class="text-warning mb-3 mt-2"><i class="bi bi-fire"></i> HOJE (${hoje.length})</h5>`;
        hoje.forEach(ag => { html += montarCard(ag, true); });
    }

    if (futuros.length > 0) {
        html += `<h5 class="text-white mb-3 mt-4"><i class="bi bi-calendar-week"></i> PRÓXIMOS (${futuros.length})</h5>`;
        futuros.forEach(ag => { html += montarCard(ag, false); });
    }

    container.innerHTML = html;
}

function montarCard(ag, ehHoje) {
    const dataFmt = new Date(ag.data + 'T00:00:00').toLocaleDateString('pt-BR');
    const classe = ag.status === 'concluido' ? 'concluido' : (ag.status === 'cancelado' ? 'cancelado' : '');
    const telefoneLimpo = (ag.clienteTelefone || '').replace(/\D/g, '');
    const preco = typeof ag.servicoPreco === 'number' ? ag.servicoPreco.toFixed(2).replace('.', ',') : '-';

    const badge = ag.status === 'concluido' ? 'success'
                : ag.status === 'cancelado' ? 'secondary'
                : 'warning';

    return `
        <div class="agendamento-card ${classe}" ${ehHoje ? 'style="border-left-color:#ffc107;"' : ''}>
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <h6 class="mb-1"><strong>${ag.horario || '--:--'}</strong> — ${ag.clienteNome || 'Sem nome'}</h6>
                    <p class="mb-1 small">📅 ${dataFmt}</p>
                    <p class="mb-1 small">💈 ${ag.servicoNome || '-'} — R$ ${preco}</p>
                    <p class="mb-1 small">📞 ${ag.clienteTelefone || '-'}</p>
                    ${ag.observacoes ? `<p class="mb-0 small text-muted">📝 ${ag.observacoes}</p>` : ''}
                    <span class="badge bg-${badge} mt-1">${ag.status || 'pendente'}</span>
                </div>
                <div class="d-flex gap-1 flex-wrap justify-content-end">
                    <button class="btn btn-sm btn-warning" onclick="lembrarCliente('${ag.id}')" title="Lembrar no WhatsApp">
                        <i class="bi bi-bell"></i>
                    </button>
                    <a href="https://wa.me/55${telefoneLimpo}" target="_blank" class="btn btn-sm btn-success" title="Abrir WhatsApp">
                        <i class="bi bi-whatsapp"></i>
                    </a>
                    <button class="btn btn-sm btn-primary" onclick="mudarStatus('${ag.id}', 'concluido')" title="Marcar concluído">
                        <i class="bi bi-check"></i>
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="mudarStatus('${ag.id}', 'cancelado')" title="Cancelar">
                        <i class="bi bi-x"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="excluirAgendamento('${ag.id}')" title="Excluir">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function mudarStatus(id, status) {
    db.ref('agendamentos/' + id + '/status').set(status);
}

function excluirAgendamento(id) {
    if (confirm('Excluir este agendamento?')) {
        db.ref('agendamentos/' + id).remove();
    }
}

// ============================================
// LEMBRETE VIA WHATSAPP
// ============================================
function lembrarCliente(id) {
    const ag = agendamentos.find(a => a.id === id);
    if (!ag) return;

    const telefoneLimpo = (ag.clienteTelefone || '').replace(/\D/g, '');
    if (!telefoneLimpo) {
        alert('Este agendamento não tem telefone cadastrado.');
        return;
    }

    const primeiroNome = (ag.clienteNome || '').split(' ')[0] || 'tudo bem';
    const dataFmt = new Date(ag.data + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

    const msg = `Fala ${primeiroNome}! Passando pra confirmar seu horário: ${dataFmt} às ${ag.horario}, serviço ${ag.servicoNome}. Tá confirmado? 💈`;

    window.open(`https://wa.me/55${telefoneLimpo}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ============================================
// SERVIÇOS
// ============================================
function renderizarServicosAdmin() {
    const container = document.getElementById('lista-servicos');
    if (!container) {
        console.error('❌ lista-servicos não existe');
        return;
    }

    let html = '';
    servicos.forEach(s => {
        const preco = typeof s.preco === 'number' ? s.preco.toFixed(2).replace('.', ',') : '-';
        html += `
            <div class="servico-admin-card">
                <div>
                    <h6 class="mb-0">${s.nome || '-'}</h6>
                    <small>${s.duracao || '-'} min - R$ ${preco}</small>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-primary" onclick="editarServico('${s.id}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="excluirServico('${s.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function editarServico(id) {
    const s = servicos.find(sv => sv.id === id);
    if (!s) return;
    document.getElementById('edit-servico-id').value = id;
    document.getElementById('edit-servico-nome').value = s.nome || '';
    document.getElementById('edit-servico-duracao').value = s.duracao || 30;
    document.getElementById('edit-servico-preco').value = s.preco || 0;
    new bootstrap.Modal(document.getElementById('modalServico')).show();
}

function salvarServico() {
    const id = document.getElementById('edit-servico-id').value;
    const dados = {
        nome: document.getElementById('edit-servico-nome').value.toUpperCase(),
        duracao: parseInt(document.getElementById('edit-servico-duracao').value) || 30,
        preco: parseFloat(document.getElementById('edit-servico-preco').value) || 0,
        icone: 'bi-scissors',
        ativo: true
    };
    db.ref('config/servicos/' + id).update(dados);
    bootstrap.Modal.getInstance(document.getElementById('modalServico')).hide();
}

function adicionarServico() {
    const id = 's' + Date.now();
    db.ref('config/servicos/' + id).set({
        nome: 'NOVO SERVIÇO',
        duracao: 30,
        preco: 0,
        icone: 'bi-scissors',
        ativo: true
    });
}

function excluirServico(id) {
    if (confirm('Excluir este serviço?')) {
        db.ref('config/servicos/' + id).remove();
    }
}

// ============================================
// BLOQUEIOS
// ============================================
function bloquearHorario() {
    const data = document.getElementById('bloqueio-data').value;
    const hora = document.getElementById('bloqueio-hora').value;

    if (!data || !hora) {
        alert('Preencha data e hora!');
        return;
    }

    db.ref('bloqueios/' + data + '/' + hora).set(true).then(() => {
        alert('Horário bloqueado!');
        document.getElementById('bloqueio-data').value = '';
        document.getElementById('bloqueio-hora').value = '';
    });
}

function renderizarBloqueios(bloqueios) {
    const container = document.getElementById('lista-bloqueios');
    if (!container) return;

    let html = '<h6 class="text-white">Horários bloqueados:</h6>';

    const datas = Object.keys(bloqueios).sort();

    if (datas.length === 0) {
        html += '<p class="text-muted small">Nenhum horário bloqueado.</p>';
    } else {
        datas.forEach(data => {
            const horas = Object.keys(bloqueios[data]);
            if (horas.length === 0) return;

            const dataFmt = new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');

            html += `<div class="agendamento-card"><strong>${dataFmt}</strong><div class="d-flex gap-1 flex-wrap mt-2">`;
            horas.forEach(hora => {
                html += `<button class="btn btn-sm btn-outline-danger" onclick="desbloquear('${data}', '${hora}')">${hora} ✕</button>`;
            });
            html += `</div></div>`;
        });
    }

    container.innerHTML = html;
}

function desbloquear(data, hora) {
    db.ref('bloqueios/' + data + '/' + hora).remove();
}

// ============================================
// ALTERAR SENHA
// ============================================
function alterarSenha() {
    const nova = document.getElementById('nova-senha').value;
    if (!nova || nova.length < 4) {
        alert('A senha precisa ter pelo menos 4 caracteres.');
        return;
    }
    db.ref('config/admin/senha').set(nova.trim()).then(() => {
        alert('Senha alterada com sucesso!');
        document.getElementById('nova-senha').value = '';
    });
}

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔵 DOMContentLoaded disparado');
    console.log('🔵 tela-login existe?', !!document.getElementById('tela-login'));
    console.log('🔵 tela-painel existe?', !!document.getElementById('tela-painel'));

    // Se já logado na sessão, abre direto
    if (sessionStorage.getItem('logado') === 'true') {
        console.log('🔵 Sessão ativa, abrindo painel');
        abrirPainel();
    }
});