// ============================================
// SEU JORGE - SISTEMA DE NOTIFICAÇÕES
// ============================================

const NOTIFICATION_CONFIG = {
    vapidKey: 'BMNlqPRApT_o_nLxDy5H2oWEe0lgD8ttq5i8KYfPEaCm0dAAD6v82GjrKl86t_HbulbLGUNF_23jS4npdEiNuik',
    icon: 'seujorge.png'
};

function notificacoesSuportadas() {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

async function solicitarPermissaoNotificacao() {
    if (!notificacoesSuportadas()) {
        console.warn('⚠️ Notificações não suportadas.');
        return false;
    }
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('✅ Permissão concedida!');
            return true;
        }
        console.log('❌ Permissão negada.');
        return false;
    } catch (err) {
        console.error('❌ Erro:', err);
        return false;
    }
}

async function obterTokenNotificacao() {
    try {
        const messaging = firebase.messaging();
        const token = await messaging.getToken({ vapidKey: NOTIFICATION_CONFIG.vapidKey });
        if (token) {
            console.log('✅ Token FCM:', token);
            return token;
        }
        console.log('⚠️ Sem token.');
        return null;
    } catch (err) {
        console.error('❌ Erro token:', err);
        return null;
    }
}

async function salvarTokenNoFirebase(token, tipo = 'cliente') {
    if (!token) return;
    const db = firebase.database();
    await db.ref(`tokens/${tipo}/${token}`).set({
        token: token,
        criadoEm: Date.now(),
        userAgent: navigator.userAgent
    });
    console.log(`✅ Token salvo (${tipo}).`);
}

async function inicializarNotificacoes(tipo = 'cliente') {
    if (!notificacoesSuportadas()) return false;

    try {
        await navigator.serviceWorker.register('firebase-messaging-sw.js');
        console.log('✅ Service Worker registrado.');
    } catch (err) {
        console.error('❌ Erro SW:', err);
        return false;
    }

    const permitido = await solicitarPermissaoNotificacao();
    if (!permitido) return false;

    const token = await obterTokenNotificacao();
    if (token) await salvarTokenNoFirebase(token, tipo);

    return true;
}

function exibirNotificacaoLocal(titulo, corpo, icone = NOTIFICATION_CONFIG.icon) {
    if (Notification.permission === 'granted') {
        new Notification(titulo, {
            body: corpo,
            icon: icone,
            badge: icone,
            vibrate: [200, 100, 200]
        });
    }
}

function statusPermissao() {
    if (!notificacoesSuportadas()) return 'nao_suportado';
    return Notification.permission;
}

window.Notificacoes = {
    solicitarPermissaoNotificacao,
    obterTokenNotificacao,
    salvarTokenNoFirebase,
    inicializarNotificacoes,
    exibirNotificacaoLocal,
    statusPermissao,
    notificacoesSuportadas
};