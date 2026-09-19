// ============================================
// SEU JORGE - AGENDAMENTO
// ============================================

const CONFIG = {
    nome: "Seu Jorge",
    whatsapp: "5515998183052",
    horarioAbertura: 9,
    horarioFechamento: 20,
    intervaloMinutos: 30,
    diasFuncionamento: [1, 2, 3, 4, 5, 6] // Seg a Sáb
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

// ============================================
// RENDERIZAR SERVIÇOS (SEÇÃO)
// ============================================
function renderizarServicos() {
    const container = document.getElementById('servicos-container');
    let html = '';

    servicos.forEach(servico => {
        html += `
            <div class="col-md-4 col-sm-6">
                <div class="servico-card" onclick="selecionarServicoRapido(${servico.id})">
                    <i class="bi ${servico.icone} servico-icone"></i>
                    <h5 class="servico-nome">${servico.nome}</h5>
                    <p class="servico-duracao"><i class="bi bi-clock"></i> ${servico.duracao} min</p>
                    <p class="servico-preco">R$ ${servico.preco.toFixed(2).replace('.', ',')}</p>
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
    document.getElementById('agendar').scrollIntoView({ behavior: 'smooth' });
    renderizarAgendamento();
}

// ============================================
// RENDERIZAR AGENDAMENTO
// ============================================
function renderizarAgendamento() {
    const servicosContainer = document.getElementById('servicos-agendamento');
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
        renderizarDatas();
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
        renderizarHorarios();
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

// ============================================
// SELECIONAR SERVIÇO
// ============================================
function selecionarServico(id) {
    agendamento.servico = servicos.find(s => s.id === id);
    agendamento.data = null;
    agendamento.horario = null;
    renderizarAgendamento();
}

// ============================================
// RENDERIZAR DATAS
// ============================================
function renderizarDatas() {
    const container = document.getElementById('datas-container');
    let html = '';
    const hoje = new Date();

    for (let i = 0; i < 14; i++) {
        const data = new Date(hoje);
        data.setDate(hoje.getDate() + i);

        if (!CONFIG.diasFuncionamento.includes(data.getDay())) continue;

        const diaSemana = data.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
        const dia = data.getDate();
        const mes = data.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
        const dataStr = data.toISOString().split('T')[0];
        const selecionado = agendamento.data === dataStr;

        html += `
            <div class="col-md-2 col-3">
                <button class="data-btn ${selecionado ? 'selecionado' : ''}" onclick="selecionarData('${dataStr}')">
                    <div class="data-dia-semana">${diaSemana}</div>
                    <div class="data-dia">${dia}</div>
                    <div class="data-mes">${mes}</div>
                </button>
            </div>
        `;
    }

    container.innerHTML = html;
}

// ============================================
// SELECIONAR DATA
// ============================================
function selecionarData(dataStr) {
    agendamento.data = dataStr;
    agendamento.horario = null;
    renderizarAgendamento();
}

// ============================================
// RENDERIZAR HORÁRIOS
// ============================================
function renderizarHorarios() {
    const container = document.getElementById('horarios-container');
    let html = '';

    const slots = gerarSlotsHorarios(agendamento.data);

    slots.forEach(slot => {
        const selecionado = agendamento.horario === slot.hora;
        const indisponivel = !slot.disponivel;

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

// ============================================
// GERAR SLOTS DE HORÁRIOS (SIMULAÇÃO)
// ============================================
function gerarSlotsHorarios(dataStr) {
    const slots = [];

    for (let h = CONFIG.horarioAbertura; h < CONFIG.horarioFechamento; h++) {
        for (let m = 0; m < 60; m += CONFIG.intervaloMinutos) {
            const hora = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            const disponivel = Math.random() > 0.4;
            slots.push({ hora, disponivel });
        }
    }

    return slots;
}

// ============================================
// SELECIONAR HORÁRIO
// ============================================
function selecionarHorario(hora) {
    agendamento.horario = hora;
    renderizarAgendamento();
}

// ============================================
// RENDERIZAR RESUMO
// ============================================
function renderizarResumo() {
    const resumo = document.getElementById('resumo-conteudo');
    const data = new Date(agendamento.data + 'T00:00:00');
    const dataFormatada = data.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

    resumo.innerHTML = `
        <div class="resumo-linha">
            <span>Serviço</span>
            <span>${agendamento.servico.nome}</span>
        </div>
        <div class="resumo-linha">
            <span>Data</span>
            <span>${dataFormatada}</span>
        </div>
        <div class="resumo-linha">
            <span>Horário</span>
            <span>${agendamento.horario}</span>
        </div>
        <div class="resumo-linha">
            <span>Duração</span>
            <span>${agendamento.servico.duracao} min</span>
        </div>
        <div class="resumo-linha">
            <span>Valor</span>
            <span>R$ ${agendamento.servico.preco.toFixed(2).replace('.', ',')}</span>
        </div>
    `;

    document.getElementById('resumo-agendamento').style.display = 'block';
}

// ============================================
// VOLTAR PASSO
// ============================================
function voltarPasso() {
    if (agendamento.horario) {
        agendamento.horario = null;
    } else if (agendamento.data) {
        agendamento.data = null;
    } else if (agendamento.servico) {
        agendamento.servico = null;
    }
    renderizarAgendamento();
}

// ============================================
// CONFIRMAR AGENDAMENTO (WHATSAPP)
// ============================================
function confirmarAgendamento() {
    const nome = document.getElementById('cliente-nome').value.trim();
    const telefone = document.getElementById('cliente-telefone').value.trim();
    const obs = document.getElementById('cliente-obs').value.trim();

    if (!nome || !telefone) {
        alert('Preencha seu nome e telefone!');
        return;
    }

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

    const url = `https://wa.me/${CONFIG.whatsapp}?text=${mensagem}`;
    window.open(url, '_blank');
}

// ============================================
// MÁSCARA DE TELEFONE
// ============================================
document.addEventListener('input', function(e) {
    if (e.target.id === 'cliente-telefone') {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);
        
        if (value.length > 10) {
            value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
        } else if (value.length > 6) {
            value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
        } else if (value.length > 2) {
            value = value.replace(/^(\d{2})(\d{0,5}).*/, '($1) $2');
        } else {
            value = value.replace(/^(\d{0,2}).*/, '($1');
        }
        
        e.target.value = value;
    }
});

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    renderizarServicos();
    renderizarAgendamento();
});