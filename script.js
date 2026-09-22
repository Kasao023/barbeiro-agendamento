// ============================================
// SEU JORGE - AGENDAMENTO COM FIREBASE
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

const CONFIG = {
    nome: "Seu Jorge",
    whatsapp: "5515998183052",
    horarioAbertura: 9,
    horarioFechamento: 20,
    intervaloMinutos: 30,
    diasFuncionamento: [1, 2, 3, 4, 5, 6],
    mesesAFrente: 3
};

const servicos = [
    { id: 1, nome: "CORTE CLÁSSICO", duracao: 30, preco: 35.00, icone: "bi-scissors" },
    { id: 2, nome: "BARBA NA NAVALHA", duracao: 20, preco: 25.00, icone: "bi-brush" },
    { id: 3, nome: "CORTE + BARBA", duracao: 50, preco: 55.00, icone: "bi-star" },
    { id: 4, nome: "SOBRANCELHA", duracao: 10, preco: 15.00, icone: "bi-eye" },
    { id: 5, nome: "PIGMENTAÇÃO", duracao: 30, preco: 40.00, icone: "bi-droplet" },
    { id: 6, nome: "COMBO COMPLETO", duracao: 60, preco: 75.00, icone: "bi-trophy" }
];

let agendamento = {
    servico: null,
    data: null,
    horario: null
};

let mesAtual = new Date();
mesAtual.setDate(1);
mesAtual.setHours(0, 0, 0, 0);

let horariosOcupados = {};

// ============================================
// RENDERIZAR SERVIÇOS
// ============================================
function renderizarServicos() {
    const container = document.getElementById('servicos-container');
    if (!container) return;

    let html = '';
    servicos.forEach(servico => {
        html += `
            <div class="col-md-4 col-sm-6">
                <div class="servico-card" onclick="selecionarServicoRapido(${servico.id})">
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

// ============================================
// SELECIONAR SERVIÇO RÁPIDO
// ============================================
function selecionarServicoRapido(id) {
    agendamento.servico = servicos.find(s => s.id === id);
    agendamento.data = null;
    agendamento.horario = null;

    const secao = document.getElementById('agendar');
    if (secao) secao.scrollIntoView({ behavior: 'smooth' });

    renderizarAgendamento();
}

// ============================================
// RENDERIZAR AGENDAMENTO
// ============================================
function renderizarAgendamento() {
    const servicosContainer = document.getElementById('servicos-agendamento');
    if (!servicosContainer) return;

    let htmlServicos = '';
    servicos.forEach(s => {
        const selecionado = agendamento.servico && agendamento.servico.id === s.id;
        htmlServicos += `
            <div class="col-md-4 col-6">
                <div class="opcao-servico ${selecionado ? 'selecionado' : ''}" onclick="selecionarServico(${s.id})">
                    <div class="opcao-nome">${s.nome}</div>
                    <div class="opcao-info">${s.duracao} min</div>
                    <div class="opcao-preco">R$ ${s.preco.toFixed(2).replace('.', ',')}</div>
                </div>
            </div>
        `;
    });
    servicosContainer.innerHTML = htmlServicos;

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
}

// ============================================
// CALENDÁRIO
// ============================================
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
        const indisponivel = ehDomingo || ehPassado;

        let classes = 'dia-calendario';
        if (indisponivel) classes += ' indisponivel';
        if (ehPassado && !ehDomingo) classes += ' passado';
        if (ehHoje) classes += ' hoje';
        if (selecionado) classes += ' selecionado';

        const onclickAttr = indisponivel ? '' : `onclick="selecionarData('${dataStr}')"`;

        html += `
            <div class="${classes}" ${onclickAttr}>
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
}

// ============================================
// CARREGAR HORÁRIOS OCUPADOS DO FIREBASE
// ============================================
function carregarHorariosOcupados() {
    const dataStr = agendamento.data;
    if (!dataStr) return;

    horariosOcupados = {};

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

// ============================================
// RENDERIZAR HORÁRIOS
// ============================================
function renderizarHorarios() {
    const container = document.getElementById('horarios-container');
    if (!container) return;

    let html = '';
    const slots = gerarSlotsHorarios();

    slots.forEach(slot => {
        const selecionado = agendamento.horario === slot.hora;
        const indisponivel = horariosOcupados[slot.hora] === true;

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
}

// ============================================
// RESUMO
// ============================================
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
    if (agendamento.horario) agendamento.horario = null;
    else if (agendamento.data) agendamento.data = null;
    else if (agendamento.servico) agendamento.servico = null;
    renderizarAgendamento();
}

// ============================================
// CONFIRMAR AGENDAMENTO (SALVA NO FIREBASE + WHATSAPP)
// ============================================
function confirmarAgendamento() {
    const nome = document.getElementById('cliente-nome').value.trim();
    const telefone = document.getElementById('cliente-telefone').value.trim();
    const obs = document.getElementById('cliente-obs').value.trim();

    if (!nome || !telefone) {
        alert('Preencha seu nome e telefone!');
        return;
    }

    // Verifica se o horário ainda está livre antes de salvar
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
                return null;
            }

            // Salva no Firebase
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
                criadoEm: Date.now()
            };

            return db.ref('agendamentos').push(novoAgendamento);
        })
        .then(resultado => {
            if (!resultado) return;

            const agendamentoId = resultado.key;
            localStorage.setItem('ultimoAgendamento', agendamentoId);

            // Envia para WhatsApp
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

            // Reset
            agendamento = { servico: null, data: null, horario: null };
            document.getElementById('cliente-nome').value = '';
            document.getElementById('cliente-telefone').value = '';
            document.getElementById('cliente-obs').value = '';

            // Redireciona para a tela "Meu Agendamento"
            window.location.href = `meu-agendamento.html?id=${agendamentoId}`;
        })
        .catch(error => {
            console.error('Erro ao salvar agendamento:', error);
            alert('Ops! Houve um erro ao salvar. Tente novamente.');
        });
}

// ============================================
// MÁSCARA DE TELEFONE
// ============================================
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
    renderizarServicos();
    renderizarAgendamento();
    console.log('✅ Site carregado. Serviços:', servicos.length);
});