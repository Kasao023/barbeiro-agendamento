// ============================================
// SEU JORGE - AGENDAMENTO COM FIREBASE + AUTH
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
const auth = firebase.auth();

const CONFIG = {
    nome: "Seu Jorge",
    whatsapp: "5515998183052",
    horarioAbertura: 9,
    horarioFechamento: 20,
    intervaloMinutos: 30,
    diasFuncionamento: [1, 2, 3, 4, 5, 6],
    mesesAFrente: 12
};

const SERVICOS_PADRAO = [
    { nome: "CORTE CLÁSSICO", duracao: 30, preco: 35.00, icone: "bi-scissors", ativo: true },
    { nome: "BARBA NA NAVALHA", duracao: 20, preco: 25.00, icone: "bi-brush", ativo: true },
    { nome: "CORTE + BARBA", duracao: 50, preco: 55.00, icone: "bi-star", ativo: true },
    { nome: "SOBRANCELHA", duracao: 10, preco: 15.00, icone: "bi-eye", ativo: true },
    { nome: "PIGMENTAÇÃO", duracao: 30, preco: 40.00, icone: "bi-droplet", ativo: true },
    { nome: "COMBO COMPLETO", duracao: 60, preco: 75.00, icone: "bi-trophy", ativo: true }
];

let servicos = [];
let currentUser = null;
let agendamentoPendente = null;  // guarda dados até o login

let agendamento = {
    servico: null,
    data: null,
    horario: null
};

let mesAtual = new Date();
mesAtual.setDate(1);
mesAtual.setHours(0, 0, 0, 0);

let horariosOcupados = {};
let diasSemanaBloqueados = {};
let diasInteirosBloqueados = {};
let diaEstaCheio = false;

// ============================================
// 🔐 AUTENTICAÇÃO
// ============================================
auth.onAuthStateChanged(user => {
    currentUser = user;
    atualizarNavbarCliente();

    // Se logou e tinha um agendamento pendente, retoma o fluxo
    if (user && agendamentoPendente) {
        const pend = agendamentoPendente;
        agendamentoPendente = null;

        // Restaura os campos que o cliente já tinha digitado
        document.getElementById('cliente-nome').value = pend.nome || '';
        document.getElementById('cliente-telefone').value = pend.telefone || '';
        document.getElementById('cliente-obs').value = pend.obs || '';

        // Fecha o modal
        const modalEl = document.getElementById('modalLoginCliente');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        // Continua automaticamente
        setTimeout(() => confirmarAgendamento(), 300);
    }
});

function atualizarNavbarCliente() {
    const elDeslogado = document.getElementById('nav-login-deslogado');
    const elLogado = document.getElementById('nav-login-logado');
    const elNome = document.getElementById('nav-nome-cliente');

    if (!elDeslogado || !elLogado) return;

    if (currentUser) {
        elDeslogado.classList.add('d-none');
        elLogado.classList.remove('d-none');
        const nome = currentUser.displayName || (currentUser.email || '').split('@')[0];
        if (elNome) elNome.textContent = nome.split(' ')[0];
    } else {
        elDeslogado.classList.remove('d-none');
        elLogado.classList.add('d-none');
    }
}

window.abrirModalLogin = function() {
    document.getElementById('login-erro-cliente').textContent = '';
    document.getElementById('login-email').value = '';
    document.getElementById('login-senha').value = '';
    document.getElementById('cadastro-email').value = '';
    document.getElementById('cadastro-senha').value = '';
    document.getElementById('cadastro-senha2').value = '';

    // Volta para tab "entrar"
    document.querySelectorAll('#tabs-login .nav-link').forEach(b => b.classList.remove('active'));
    document.querySelector('#tabs-login .nav-link[data-tab="entrar"]').classList.add('active');
    document.getElementById('form-entrar').style.display = 'block';
    document.getElementById('form-criar').style.display = 'none';

    new bootstrap.Modal(document.getElementById('modalLoginCliente')).show();
};

// Tabs do modal
document.addEventListener('click', function(e) {
    const btn = e.target.closest('#tabs-login .nav-link');
    if (!btn) return;
    const tab = btn.dataset.tab;

    document.querySelectorAll('#tabs-login .nav-link').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    document.getElementById('form-entrar').style.display = tab === 'entrar' ? 'block' : 'none';
    document.getElementById('form-criar').style.display = tab === 'criar' ? 'block' : 'none';
    document.getElementById('login-erro-cliente').textContent = '';
});

function traduzErroAuth(code) {
    const m = {
        'auth/user-not-found': '❌ Email não cadastrado.',
        'auth/wrong-password': '❌ Senha incorreta.',
        'auth/invalid-email': '❌ Email inválido.',
        'auth/invalid-credential': '❌ Email ou senha incorretos.',
        'auth/email-already-in-use': '❌ Este email já está cadastrado. Tente entrar.',
        'auth/weak-password': '❌ Senha muito fraca (mínimo 6 caracteres).',
        'auth/too-many-requests': '⚠️ Muitas tentativas. Aguarde 1 minuto.',
        'auth/network-request-failed': '🌐 Sem conexão. Verifique sua internet.',
        'auth/popup-closed-by-user': '⚠️ Login cancelado.',
        'auth/popup-blocked': '⚠️ Popup bloqueado. Permita popups para este site.'
    };
    return m[code] || '❌ Erro: ' + code;
}

window.loginCliente = async function() {
    const email = document.getElementById('login-email').value.trim();
    const senha = document.getElementById('login-senha').value;
    const erroEl = document.getElementById('login-erro-cliente');
    const btn = document.getElementById('btn-login-cliente');
    erroEl.textContent = '';

    if (!email || !senha) { erroEl.textContent = 'Preencha email e senha.'; return; }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Entrando...';

    try {
        await auth.signInWithEmailAndPassword(email, senha);
        // onAuthStateChanged cuida do resto
    } catch (err) {
        erroEl.textContent = traduzErroAuth(err.code);
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> ENTRAR';
    }
};

window.cadastroCliente = async function() {
    const email = document.getElementById('cadastro-email').value.trim();
    const s1 = document.getElementById('cadastro-senha').value;
    const s2 = document.getElementById('cadastro-senha2').value;
    const erroEl = document.getElementById('login-erro-cliente');
    const btn = document.getElementById('btn-cadastro-cliente');
    erroEl.textContent = '';

    if (!email || !s1 || !s2) { erroEl.textContent = 'Preencha todos os campos.'; return; }
    if (s1.length < 6) { erroEl.textContent = 'Senha precisa ter pelo menos 6 caracteres.'; return; }
    if (s1 !== s2) { erroEl.textContent = 'As senhas não coincidem.'; return; }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Criando...';

    try {
        await auth.createUserWithEmailAndPassword(email, s1);
        // onAuthStateChanged cuida do resto
    } catch (err) {
        erroEl.textContent = traduzErroAuth(err.code);
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-person-plus"></i> CRIAR CONTA';
    }
};

window.loginGoogle = async function() {
    const erroEl = document.getElementById('login-erro-cliente');
    erroEl.textContent = '';
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        await auth.signInWithPopup(provider);
    } catch (err) {
        erroEl.textContent = traduzErroAuth(err.code);
    }
};

window.logoutCliente = async function() {
    if (!confirm('Deseja sair?')) return;
    await auth.signOut();
    // opcional: recarregar para limpar estado
    location.reload();
};

window.esqueceuSenhaCliente = async function() {
    const email = document.getElementById('login-email').value.trim();
    if (!email) {
        alert('Digite seu email primeiro para receber o link.');
        return;
    }
    if (!confirm(`Enviar link de redefinição para:\n\n${email}?`)) return;
    try {
        await auth.sendPasswordResetEmail(email);
        alert('✅ Link enviado! Confira seu email (e o spam).');
    } catch (err) {
        alert(traduzErroAuth(err.code));
    }
};

// ============================================
// ROLAGEM AUTOMÁTICA ENTRE OS PASSOS
// ============================================
function scrollParaPasso(idPasso) {
    setTimeout(() => {
        const el = document.getElementById(idPasso);
        if (!el) return;
        if (el.style.display === 'none') return;

        const offsetNavbar = 100;
        const y = el.getBoundingClientRect().top + window.pageYOffset - offsetNavbar;

        window.scrollTo({ top: y, behavior: 'smooth' });
    }, 220);
}

// ============================================
// CARREGAR SERVIÇOS DO FIREBASE
// ============================================
function carregarServicosDoFirebase() {
    db.ref('config/servicos').on('value', snap => {
        if (!snap.exists()) {
            console.log('📦 Primeira vez: salvando serviços padrão no Firebase...');
            SERVICOS_PADRAO.forEach((s, i) => {
                const id = 's' + (Date.now() + i);
                db.ref('config/servicos/' + id).set(s);
            });
            return;
        }

        servicos = [];
        snap.forEach(child => {
            const val = child.val();
            if (val.ativo !== false) {
                servicos.push({
                    id: child.key,
                    nome: val.nome || 'SEM NOME',
                    duracao: val.duracao || 30,
                    preco: typeof val.preco === 'number' ? val.preco : 0,
                    icone: val.icone || 'bi-scissors'
                });
            }
        });

        console.log('✅ Serviços carregados do Firebase:', servicos.length);

        if (agendamento.servico) {
            const reencontrado = servicos.find(s => s.id === agendamento.servico.id);
            if (reencontrado) {
                agendamento.servico = reencontrado;
            } else {
                agendamento.servico = null;
                agendamento.data = null;
                agendamento.horario = null;
            }
        }

        renderizarServicos();
        renderizarAgendamento();
    });
}

// ============================================
// RENDERIZAR SERVIÇOS
// ============================================
function renderizarServicos() {
    const container = document.getElementById('servicos-container');
    if (!container) return;

    if (servicos.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">Nenhum serviço cadastrado no momento.</p>';
        return;
    }

    let html = '';
    servicos.forEach(servico => {
        html += `
            <div class="col-md-4 col-sm-6">
                <div class="servico-card" onclick="selecionarServicoRapido('${servico.id}')">
                    <i class="bi ${servico.icone} servico-icone"></i>
                    <h5 class="servico-nome">${servico.nome}</h5>
                    <p class="servico-duracao"><i class="bi bi-clock"></i> ${servico.duracao} min</p>
                    <p class="servico-preco">R$ ${servico.preco.toFixed(2).replace('.', ',')}</p>
                    <div class="servico-botao">
                        <i class="bi bi-calendar-check"></i> AGENDAR
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function selecionarServicoRapido(id) {
    agendamento.servico = servicos.find(s => s.id === id);
    agendamento.data = null;
    agendamento.horario = null;

    const secao = document.getElementById('agendar');
    if (secao) secao.scrollIntoView({ behavior: 'smooth' });

    renderizarAgendamento();
    scrollParaPasso('passo-2');
}

function renderizarAgendamento() {
    const servicosContainer = document.getElementById('servicos-agendamento');
    if (!servicosContainer) return;

    if (servicos.length === 0) {
        servicosContainer.innerHTML = '<p class="text-center text-muted">Nenhum serviço cadastrado no momento.</p>';
    } else {
        let htmlServicos = '';
        servicos.forEach(s => {
            const selecionado = agendamento.servico && agendamento.servico.id === s.id;
            htmlServicos += `
                <div class="col-md-4 col-6">
                    <div class="opcao-servico ${selecionado ? 'selecionado' : ''}" onclick="selecionarServico('${s.id}')">
                        <div class="opcao-nome">${s.nome}</div>
                        <div class="opcao-info">${s.duracao} min</div>
                        <div class="opcao-preco">R$ ${s.preco.toFixed(2).replace('.', ',')}</div>
                    </div>
                </div>
            `;
        });
        servicosContainer.innerHTML = htmlServicos;
    }

    if (agendamento.servico) {
        document.getElementById('passo-2').style.display = 'block';
        renderizarCalendario();
    } else {
        document.getElementById('passo-2').style.display = 'none';
        document.getElementById('passo-3').style.display = 'none';
        document.getElementById('passo-4').style.display = 'none';
        document.getElementById('resumo-agendamento').style.display = 'none';
        document.getElementById('btn-confirmar').style.display = 'none';
        document.getElementById('btn-voltar').style.display = 'none';
    }

    if (agendamento.data) {
        document.getElementById('passo-3').style.display = 'block';
        carregarHorariosOcupados();
    } else {
        document.getElementById('passo-3').style.display = 'none';
    }

    if (agendamento.horario) {
        document.getElementById('passo-4').style.display = 'block';
        renderizarResumo();
        document.getElementById('btn-confirmar').style.display = 'block';
        document.getElementById('btn-voltar').style.display = 'block';

        // Aviso de login (se não estiver logado)
        const aviso = document.getElementById('login-aviso');
        if (aviso) aviso.style.display = currentUser ? 'none' : 'block';
    } else {
        document.getElementById('passo-4').style.display = 'none';
        document.getElementById('resumo-agendamento').style.display = 'none';
        document.getElementById('btn-confirmar').style.display = 'none';
        document.getElementById('btn-voltar').style.display = 'none';
    }
}

function selecionarServico(id) {
    agendamento.servico = servicos.find(s => s.id === id);
    agendamento.data = null;
    agendamento.horario = null;
    renderizarAgendamento();
    scrollParaPasso('passo-2');
}

function mudarMes(delta) {
    const novoMes = new Date(mesAtual);
    novoMes.setMonth(novoMes.getMonth() + delta);
    novoMes.setDate(1);
    novoMes.setHours(0, 0, 0, 0);

    const hoje = new Date();
    const mesMinimo = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    mesMinimo.setHours(0, 0, 0, 0);

    if (novoMes < mesMinimo) return;

    const maxMes = new Date(hoje.getFullYear(), hoje.getMonth() + CONFIG.mesesAFrente - 1, 1);
    maxMes.setHours(0, 0, 0, 0);

    if (novoMes > maxMes) return;

    mesAtual = novoMes;
    renderizarCalendario();
}

function renderizarCalendario() {
    const titulo = document.getElementById('calendario-titulo');
    const grade = document.getElementById('calendario-grade');
    if (!titulo || !grade) return;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();

    const nomeMes = mesAtual.toLocaleDateString('pt-BR', { month: 'long' });
    titulo.textContent = `${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)} ${ano}`;

    const mesAtualNormalizado = new Date(ano, mes, 1);
    mesAtualNormalizado.setHours(0, 0, 0, 0);

    const mesMinimo = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    mesMinimo.setHours(0, 0, 0, 0);

    const maxMes = new Date(hoje.getFullYear(), hoje.getMonth() + CONFIG.mesesAFrente - 1, 1);
    maxMes.setHours(0, 0, 0, 0);

    const botoesNav = document.querySelectorAll('.calendario-nav');
    if (botoesNav.length >= 2) {
        botoesNav[0].disabled = mesAtualNormalizado <= mesMinimo;
        botoesNav[1].disabled = mesAtualNormalizado >= maxMes;
    }

    const primeiroDia = new Date(ano, mes, 1).getDay();
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();

    let html = '';

    for (let i = 0; i < primeiroDia; i++) {
        html += `<div class="dia-calendario vazio"></div>`;
    }

    for (let dia = 1; dia <= ultimoDia; dia++) {
        const dataObj = new Date(ano, mes, dia);
        dataObj.setHours(0, 0, 0, 0);

        const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        const diaSemana = dataObj.getDay();

        const ehDomingo = diaSemana === 0;
        const ehPassado = dataObj < hoje;
        const ehHoje = dataObj.getTime() === hoje.getTime();
        const selecionado = agendamento.data === dataStr;

        const diaSemanaBloqueado = !!diasSemanaBloqueados[diaSemana];
        const diaInteiroBloqueado = !!diasInteirosBloqueados[dataStr];

        const indisponivel = ehDomingo || ehPassado || diaSemanaBloqueado || diaInteiroBloqueado;

        let classes = 'dia-calendario';
        if (indisponivel) classes += ' indisponivel';
        if (ehPassado && !ehDomingo) classes += ' passado';
        if (ehHoje) classes += ' hoje';
        if (selecionado) classes += ' selecionado';
        if (diaSemanaBloqueado || diaInteiroBloqueado) classes += ' bloqueado';

        const onclickAttr = indisponivel ? '' : `onclick="selecionarData('${dataStr}')"`;
        const titleAttr = diaInteiroBloqueado
            ? 'Dia bloqueado'
            : (diaSemanaBloqueado ? 'Dia da semana bloqueado' : '');

        html += `
            <div class="${classes}" ${onclickAttr} title="${titleAttr}">
                ${dia}
            </div>
        `;
    }

    grade.innerHTML = html;
}

function selecionarData(dataStr) {
    agendamento.data = dataStr;
    agendamento.horario = null;
    renderizarAgendamento();
    scrollParaPasso('passo-3');
}

function carregarHorariosOcupados() {
    const dataStr = agendamento.data;
    if (!dataStr) return;

    horariosOcupados = {};

    const diaSemana = new Date(dataStr + 'T00:00:00').getDay();
    const diaSemanaBloqueado = !!diasSemanaBloqueados[diaSemana];
    const diaInteiroBloqueado = !!diasInteirosBloqueados[dataStr];

    if (diaSemanaBloqueado || diaInteiroBloqueado) {
        gerarSlotsHorarios().forEach(slot => {
            horariosOcupados[slot.hora] = true;
        });
        diaEstaCheio = false;
        renderizarHorarios();
        return;
    }

    db.ref('agendamentos').orderByChild('data').equalTo(dataStr).once('value')
        .then(snapshot => {
            snapshot.forEach(child => {
                const ag = child.val();
                if (ag.status !== 'cancelado') {
                    horariosOcupados[ag.horario] = true;
                }
            });

            return db.ref('bloqueios/' + dataStr).once('value');
        })
        .then(snapBloqueios => {
            if (snapBloqueios && snapBloqueios.exists()) {
                snapBloqueios.forEach(child => {
                    horariosOcupados[child.key] = true;
                });
            }
            renderizarHorarios();
        })
        .catch(error => {
            console.error('Erro ao carregar horários:', error);
            renderizarHorarios();
        });
}

function renderizarHorarios() {
    const container = document.getElementById('horarios-container');
    const listaEsperaContainer = document.getElementById('lista-espera-container');
    if (!container) return;

    const slots = gerarSlotsHorarios();
    let todosOcupados = true;
    let html = '';

    slots.forEach(slot => {
        const selecionado = agendamento.horario === slot.hora;
        const indisponivel = horariosOcupados[slot.hora] === true;

        if (!indisponivel) todosOcupados = false;

        html += `
            <div class="col-md-2 col-4">
                <button class="horario-btn ${selecionado ? 'selecionado' : ''} ${indisponivel ? 'indisponivel' : ''}" 
                        ${indisponivel ? 'disabled' : ''}
                        onclick="selecionarHorario('${slot.hora}')">
                    ${slot.hora}
                </button>
            </div>
        `;
    });

    container.innerHTML = html;
    diaEstaCheio = todosOcupados;

    if (listaEsperaContainer) {
        listaEsperaContainer.style.display = todosOcupados ? 'block' : 'none';
    }
}

function gerarSlotsHorarios() {
    const slots = [];
    for (let h = CONFIG.horarioAbertura; h < CONFIG.horarioFechamento; h++) {
        for (let m = 0; m < 60; m += CONFIG.intervaloMinutos) {
            const hora = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            slots.push({ hora });
        }
    }
    return slots;
}

function selecionarHorario(hora) {
    agendamento.horario = hora;
    renderizarAgendamento();
    scrollParaPasso('passo-4');
}

function renderizarResumo() {
    const resumo = document.getElementById('resumo-conteudo');
    if (!resumo) return;

    const data = new Date(agendamento.data + 'T00:00:00');
    const dataFormatada = data.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

    resumo.innerHTML = `
        <div class="resumo-linha"><span>Serviço</span><span>${agendamento.servico.nome}</span></div>
        <div class="resumo-linha"><span>Data</span><span>${dataFormatada}</span></div>
        <div class="resumo-linha"><span>Horário</span><span>${agendamento.horario}</span></div>
        <div class="resumo-linha"><span>Duração</span><span>${agendamento.servico.duracao} min</span></div>
        <div class="resumo-linha"><span>Valor</span><span>R$ ${agendamento.servico.preco.toFixed(2).replace('.', ',')}</span></div>
    `;

    document.getElementById('resumo-agendamento').style.display = 'block';
}

function voltarPasso() {
    if (agendamento.horario) {
        agendamento.horario = null;
        renderizarAgendamento();
        scrollParaPasso('passo-3');
    }
    else if (agendamento.data) {
        agendamento.data = null;
        renderizarAgendamento();
        scrollParaPasso('passo-2');
    }
    else if (agendamento.servico) {
        agendamento.servico = null;
        renderizarAgendamento();
        scrollParaPasso('passo-1');
    }
}

// ============================================
// LISTA DE ESPERA
// ============================================
function abrirFormEspera() {
    if (!agendamento.data || !agendamento.servico) {
        alert('Selecione um serviço e uma data primeiro.');
        return;
    }

    const dataLabel = document.getElementById('espera-data-label');
    const dataObj = new Date(agendamento.data + 'T00:00:00');
    dataLabel.textContent = dataObj.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    document.getElementById('espera-nome').value = '';
    document.getElementById('espera-telefone').value = '';
    document.getElementById('espera-erro').textContent = '';

    new bootstrap.Modal(document.getElementById('modalEspera')).show();
}

function salvarListaEspera() {
    const nome = document.getElementById('espera-nome').value.trim();
    const telefone = document.getElementById('espera-telefone').value.trim();
    const erroEl = document.getElementById('espera-erro');

    erroEl.textContent = '';

    if (!nome || !telefone) { erroEl.textContent = 'Preencha nome e WhatsApp.'; return; }
    if (telefone.replace(/\D/g, '').length < 10) { erroEl.textContent = 'Telefone inválido.'; return; }

    db.ref('lista-espera/' + agendamento.data).once('value')
        .then(snap => {
            let duplicado = false;
            const telLimpo = telefone.replace(/\D/g, '');

            if (snap.exists()) {
                snap.forEach(child => {
                    const item = child.val();
                    const telItem = (item.telefone || '').replace(/\D/g, '');
                    if (telItem === telLimpo) duplicado = true;
                });
            }

            if (duplicado) {
                erroEl.textContent = 'Você já está na lista deste dia!';
                return;
            }

            const novaEspera = {
                nome: nome,
                telefone: telefone,
                servicoNome: agendamento.servico.nome,
                servicoPreco: agendamento.servico.preco,
                criadoEm: Date.now(),
                status: 'aguardando'
            };

            return db.ref('lista-espera/' + agendamento.data).push(novaEspera);
        })
        .then(resultado => {
            if (!resultado) return;

            bootstrap.Modal.getInstance(document.getElementById('modalEspera')).hide();

            alert('✅ Você entrou na lista de espera!\n\nSe alguém cancelar no dia ' + 
                  new Date(agendamento.data + 'T00:00:00').toLocaleDateString('pt-BR') + 
                  ', o Seu Jorge entrará em contato pelo WhatsApp.');

            agendamento.horario = null;
            document.getElementById('lista-espera-container').style.display = 'none';
        })
        .catch(error => {
            console.error('Erro ao entrar na lista:', error);
            erroEl.textContent = 'Erro ao salvar. Tente novamente.';
        });
}

// ============================================
// CONFIRMAR AGENDAMENTO (com login)
// ============================================
function confirmarAgendamento() {
    const nome = document.getElementById('cliente-nome').value.trim();
    const telefone = document.getElementById('cliente-telefone').value.trim();
    const obs = document.getElementById('cliente-obs').value.trim();

    if (!nome || !telefone) {
        alert('Preencha seu nome e telefone!');
        return;
    }

    // ⭐ CHAVE: se não estiver logado, guarda e abre login
    if (!currentUser) {
        agendamentoPendente = { nome, telefone, obs };
        const sub = document.getElementById('modal-login-sub');
        if (sub) sub.textContent = 'Faça login rapidinho para confirmar seu agendamento. Seus dados foram guardados.';
        abrirModalLogin();
        return;
    }

    const diaSemana = new Date(agendamento.data + 'T00:00:00').getDay();
    if (diasSemanaBloqueados[diaSemana] || diasInteirosBloqueados[agendamento.data]) {
        alert('Este dia não está disponível para agendamento.');
        return;
    }

    db.ref('agendamentos').orderByChild('data').equalTo(agendamento.data).once('value')
        .then(snapshot => {
            let ocupado = false;
            snapshot.forEach(child => {
                const ag = child.val();
                if (ag.horario === agendamento.horario && ag.status !== 'cancelado') {
                    ocupado = true;
                }
            });

            if (ocupado) {
                alert('Ops! Esse horário acabou de ser agendado por outra pessoa. Escolha outro.');
                agendamento.horario = null;
                carregarHorariosOcupados();
                scrollParaPasso('passo-3');
                return null;
            }

            const novoAgendamento = {
                clienteNome: nome,
                clienteTelefone: telefone,
                servicoNome: agendamento.servico.nome,
                servicoPreco: agendamento.servico.preco,
                servicoDuracao: agendamento.servico.duracao,
                data: agendamento.data,
                horario: agendamento.horario,
                observacoes: obs,
                status: 'pendente',
                criadoEm: Date.now(),
                uid: currentUser.uid,
                clienteEmail: currentUser.email || null
            };

            return db.ref('agendamentos').push(novoAgendamento);
        })
        .then(resultado => {
            if (!resultado) return;

            const agendamentoId = resultado.key;
            localStorage.setItem('ultimoAgendamento', agendamentoId);
            localStorage.setItem('ultimoTelefone', telefone);
            localStorage.setItem('ultimoNome', nome);

            const data = new Date(agendamento.data + 'T00:00:00');
            const dataFormatada = data.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

            let mensagem = `*✂️ NOVO AGENDAMENTO - ${CONFIG.nome}*%0A`;
            mensagem += `%0A━━━━━━━━━━━━━━━━━━%0A`;
            mensagem += `*👤 DADOS DO CLIENTE*%0A`;
            mensagem += `Nome: ${nome}%0A`;
            mensagem += `Telefone: ${telefone}%0A`;
            mensagem += `%0A━━━━━━━━━━━━━━━━━━%0A`;
            mensagem += `*📋 SERVIÇO*%0A`;
            mensagem += `Serviço: ${agendamento.servico.nome}%0A`;
            mensagem += `Duração: ${agendamento.servico.duracao} min%0A`;
            mensagem += `Valor: R$ ${agendamento.servico.preco.toFixed(2).replace('.', ',')}%0A`;
            mensagem += `%0A━━━━━━━━━━━━━━━━━━%0A`;
            mensagem += `*📅 DATA E HORÁRIO*%0A`;
            mensagem += `Data: ${dataFormatada}%0A`;
            mensagem += `Horário: ${agendamento.horario}%0A`;

            if (obs) {
                mensagem += `%0A━━━━━━━━━━━━━━━━━━%0A`;
                mensagem += `*📝 Observações:*%0A${obs}%0A`;
            }

            window.open(`https://wa.me/${CONFIG.whatsapp}?text=${mensagem}`, '_blank');

            if (typeof Notificacoes !== 'undefined' && Notificacoes.statusPermissao() === 'granted') {
                const dataNotif = new Date(agendamento.data + 'T00:00:00').toLocaleDateString('pt-BR');
                Notificacoes.exibirNotificacaoLocal(
                    '✅ Agendamento Confirmado!',
                    `Seu horário: ${dataNotif} às ${agendamento.horario}. Mantenha as notificações ativas para receber lembretes!`,
                    'seujorge.png'
                );
            }

            agendamento = { servico: null, data: null, horario: null };
            document.getElementById('cliente-nome').value = '';
            document.getElementById('cliente-telefone').value = '';
            document.getElementById('cliente-obs').value = '';

            window.location.href = `meu-agendamento.html?id=${agendamentoId}`;
        })
        .catch(error => {
            console.error('Erro ao salvar agendamento:', error);
            alert('Ops! Houve um erro ao salvar. Tente novamente.');
        });
}

// Máscara do telefone do passo 4
document.addEventListener('input', function(e) {
    if (e.target.id === 'cliente-telefone') {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);
        if (value.length > 10) value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
        else if (value.length > 6) value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
        else if (value.length > 2) value = value.replace(/^(\d{2})(\d{0,5}).*/, '($1) $2');
        else value = value.replace(/^(\d{0,2}).*/, '($1');
        e.target.value = value;
    }
});

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    carregarServicosDoFirebase();

    db.ref('bloqueios-semana').on('value', snap => {
        diasSemanaBloqueados = snap.val() || {};
        if (agendamento.servico) renderizarCalendario();
    });

    db.ref('bloqueios-dia').on('value', snap => {
        diasInteirosBloqueados = snap.val() || {};
        if (agendamento.servico) renderizarCalendario();
    });

    console.log('✅ Site carregado.');
});