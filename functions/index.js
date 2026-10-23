// ============================================
// SEU JORGE - CLOUD FUNCTIONS DE NOTIFICAÇÃO
// ============================================
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// ============================================
// HELPERS
// ============================================

/**
 * Busca todos os tokens de admin cadastrados
 */
async function pegarTokensAdmin() {
    const snap = await admin.database().ref('tokens/admin').once('value');
    const tokens = [];
    snap.forEach(t => tokens.push(t.key));
    return tokens;
}

/**
 * Busca os tokens de um cliente pelo uid
 */
async function pegarTokensCliente(uid) {
    if (!uid) return [];
    const snap = await admin.database().ref('tokens/cliente').once('value');
    const tokens = [];
    snap.forEach(t => {
        const val = t.val();
        if (val && val.uid === uid) tokens.push(t.key);
    });
    return tokens;
}

/**
 * Envia push para uma lista de tokens (API nova - sendEachForMulticast)
 * Também limpa tokens inválidos automaticamente
 */
async function enviarPush(tokens, titulo, corpo, dados = {}) {
    if (!tokens || tokens.length === 0) {
        console.log('⚠️ Nenhum token para enviar.');
        return null;
    }

    try {
        const response = await admin.messaging().sendEachForMulticast({
            tokens,
            notification: {
                title: titulo,
                body: corpo
            },
            data: dados,
            webpush: {
                notification: {
                    icon: 'seujorge.png',
                    badge: 'seujorge.png',
                    vibrate: [200, 100, 200]
                },
                fcmOptions: {
                    link: dados.url || '/'
                }
            }
        });

        console.log(`✅ Push enviado: ${response.successCount}/${tokens.length} sucesso(s)`);

        // Limpa tokens inválidos
        if (response.failureCount > 0) {
            const updates = {};
            response.responses.forEach((r, i) => {
                if (!r.success) {
                    console.log('❌ Token inválido:', tokens[i].substring(0, 20), '—', r.error?.code);
                    updates['tokens/admin/' + tokens[i]] = null;
                    updates['tokens/cliente/' + tokens[i]] = null;
                }
            });
            if (Object.keys(updates).length > 0) {
                await admin.database().ref().update(updates);
                console.log(`🧹 ${Object.keys(updates).length} token(s) inválido(s) removido(s).`);
            }
        }

        return response;
    } catch (err) {
        console.error('❌ Erro ao enviar push:', err);
        return null;
    }
}

/**
 * Formata data YYYY-MM-DD para DD/MM/YYYY
 */
function formatarData(dataStr) {
    if (!dataStr) return '';
    const [y, m, d] = dataStr.split('-');
    return `${d}/${m}/${y}`;
}

// ============================================
// 1. NOVO AGENDAMENTO → avisa o ADMIN
// ============================================
exports.notificarNovoAgendamento = functions.database
    .ref('/agendamentos/{id}')
    .onCreate(async (snap, context) => {
        const ag = snap.val();
        if (!ag) return null;

        console.log('📩 Novo agendamento:', ag.clienteNome, '|', ag.data, ag.horario);

        const tokens = await pegarTokensAdmin();
        const dataFmt = formatarData(ag.data);

        await enviarPush(
            tokens,
            '🔔 Novo agendamento!',
            `${ag.clienteNome} — ${dataFmt} às ${ag.horario}`,
            {
                url: '/admin.html',
                agendamentoId: context.params.id
            }
        );

        return null;
    });

// ============================================
// 2. STATUS MUDOU → avisa o CLIENTE
// ============================================
exports.notificarMudancaStatus = functions.database
    .ref('/agendamentos/{id}/status')
    .onUpdate(async (change, context) => {
        const novo = change.after.val();
        const antigo = change.before.val();

        if (novo === antigo) return null;

        console.log(`🔄 Status do agendamento ${context.params.id}: ${antigo} → ${novo}`);

        // Pega o agendamento completo
        const snapAg = await admin.database()
            .ref('/agendamentos/' + context.params.id).once('value');
        const ag = snapAg.val();

        if (!ag) {
            console.log('⚠️ Agendamento não existe mais.');
            return null;
        }

        if (!ag.uid) {
            console.log('⚠️ Agendamento sem uid — cliente não pode ser notificado.');
            return null;
        }

        const tokens = await pegarTokensCliente(ag.uid);

        if (tokens.length === 0) {
            console.log('⚠️ Cliente não tem token registrado.');
            return null;
        }

        const dataFmt = formatarData(ag.data);
        const primeiroNome = (ag.clienteNome || 'Cliente').split(' ')[0];

        let titulo, corpo;
        switch (novo) {
            case 'confirmado':
                titulo = '📌 Horário confirmado!';
                corpo = `${ag.servicoNome} — ${dataFmt} às ${ag.horario}. Te esperamos!`;
                break;
            case 'concluido':
                titulo = '✅ Atendimento concluído!';
                corpo = `Obrigado pela visita, ${primeiroNome}! Volte sempre.`;
                break;
            case 'cancelado':
                titulo = '❌ Agendamento cancelado';
                corpo = `Seu horário de ${dataFmt} às ${ag.horario} foi cancelado.`;
                break;
            default:
                return null;
        }

        await enviarPush(tokens, titulo, corpo, {
            url: '/meu-agendamento.html',
            agendamentoId: context.params.id
        });

        return null;
    });

// ============================================
// 3. AGENDAMENTO DELETADO → avisa o ADMIN
// ============================================
exports.notificarCancelamento = functions.database
    .ref('/agendamentos/{id}')
    .onDelete(async (snap, context) => {
        const ag = snap.val();
        if (!ag) return null;

        console.log('🗑️ Agendamento excluído:', ag.clienteNome, '|', ag.data, ag.horario);

        const tokens = await pegarTokensAdmin();
        const dataFmt = formatarData(ag.data);

        await enviarPush(
            tokens,
            '🗑️ Agendamento excluído',
            `${ag.clienteNome} — ${dataFmt} às ${ag.horario}`,
            { url: '/admin.html' }
        );

        return null;
    });