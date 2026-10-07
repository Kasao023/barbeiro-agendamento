const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// ============================================
// 1. NOVO AGENDAMENTO → avisa o ADMIN
// ============================================
exports.notificarNovoAgendamento = functions.database
    .ref('/agendamentos/{id}')
    .onCreate(async (snap, context) => {
        const ag = snap.val();
        console.log('📩 Novo agendamento:', ag);

        const tokensSnap = await admin.database().ref('tokens/admin').once('value');
        const tokens = [];
        tokensSnap.forEach(t => tokens.push(t.key));

        if (tokens.length === 0) {
            console.log('⚠️ Nenhum token de admin cadastrado.');
            return null;
        }

        const mensagem = {
            notification: {
                title: '🔔 Novo agendamento!',
                body: `${ag.clienteNome} — ${ag.horario} (${ag.servicoNome})`
            },
            data: {
                url: '/admin.html',
                agendamentoId: context.params.id
            }
        };

        const response = await admin.messaging().sendToDevice(tokens, mensagem);
        console.log('✅ Notificação enviada:', response.successCount, 'sucesso(s)');
        return response;
    });

// ============================================
// 2. AGENDAMENTO CANCELADO → avisa o ADMIN
// ============================================
exports.notificarCancelamento = functions.database
    .ref('/agendamentos/{id}')
    .onDelete(async (snap, context) => {
        const ag = snap.val();
        if (!ag) return null;

        const tokensSnap = await admin.database().ref('tokens/admin').once('value');
        const tokens = [];
        tokensSnap.forEach(t => tokens.push(t.key));

        if (tokens.length === 0) return null;

        const mensagem = {
            notification: {
                title: '❌ Agendamento cancelado',
                body: `${ag.clienteNome} — ${ag.horario} (${ag.servicoNome})`
            },
            data: { url: '/admin.html' }
        };

        return admin.messaging().sendToDevice(tokens, mensagem);
    });