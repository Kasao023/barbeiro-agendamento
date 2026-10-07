// ============================================
// SEU JORGE - SISTEMA DE NOTIFICAÇÕES (CORRIGIDO)
// ============================================

const NOTIFICATION_CONFIG = {
    vapidKey: 'BMNlqPRApT_o_nLxDy5H2oWEe0lgD8ttq5i8KYfPEaCm0dAAD6v82GjrKl86t_HbulbLGUNF_23jS4npdEiNuik',
    icon: 'seujorge.png'
};

let __messagingInstance = null;

function getMessaging() {
    if (!__messagingInstance) {
        __messagingInstance = firebase.messaging();

        // Listener de refresh do token (evita token obsoleto)
        __messagingInstance.onTokenRefresh(async () => {
            try {
                const newToken = await __messagingInstance.getToken({
                    vapidKey: NOTIFICATION_CONFIG.vapidKey
                });
                if (newToken) {
                    await salvarTokenNoFirebase(newToken, 'cliente');
                    console.log('🔄 Token atualizado:', newToken);
                }
            } catch (err) {
                console.error('❌ Erro ao atualizar token:', err);
            }
        });
    }
    return __messagingInstance;
}

function notificacoesSuportadas() {
    const httpsOK = location.protocol === 'https:'
                 || location.hostname === 'localhost'
                 || location.hostname === '127.0.0.1';

    return httpsOK
        && 'Notification' in window
        && 'serviceWorker' in navigator
        && 'PushManager' in window;
}

async function solicitarPermissaoNotificacao() {
    if (!notificacoesSuportadas()) {
        console.warn('⚠️ Notificações não suportadas neste ambiente.');
        return false;
    }
    try {
        const permission = await Notification.requestPermission();
        console.log(permission === 'granted' ? '✅ Permissão concedida!' : '❌ Permissão negada.');
        return permission === 'granted';
    } catch (err) {
        console.error('❌ Erro ao solicitar permissão:', err);
        return false;
    }
}

async function obterTokenNotificacao() {
    try {
        const messaging = getMessaging();
        const token = await messaging.getToken({
            vapidKey: NOTIFICATION_CONFIG.vapidKey
        });
        if (token) {
            console.log('✅ Token FCM obtido.');
            return token;
        }
        console.warn('⚠️ Sem token FCM.');
        return null;
    } catch (err) {
        console.error('❌ Erro ao obter token:', err);
        return null;
    }
}

async function salvarTokenNoFirebase(token, tipo = 'cliente') {
    if (!token) return;
    const db = firebase.database();
    await db.ref(`tokens/${tipo}/${token}`).set({
        token,
        criadoEm: Date.now(),
        userAgent: navigator.userAgent,
        telefone: localStorage.getItem('ultimoTelefone') || null,
        agendamentoId: localStorage.getItem('ultimoAgendamento') || null
    });
    console.log(`✅ Token salvo em tokens/${tipo}/`);
}

async function inicializarNotificacoes(tipo = 'cliente') {
    if (!notificacoesSuportadas()) {
        alert('⚠️ Este navegador não suporta notificações ou você não está em HTTPS.');
        return false;
    }

    try {
        const reg = await navigator.serviceWorker.register('firebase-messaging-sw.js');
        console.log('✅ Service Worker registrado:', reg.scope);
    } catch (err) {
        console.error('❌ Erro ao registrar SW:', err);
        return false;
    }

    const permitido = await solicitarPermissaoNotificacao();
    if (!permitido) return false;

    const token = await obterTokenNotificacao();
    if (token) await salvarTokenNoFirebase(token, tipo);

    return true;
}

// Sempre usar o Service Worker (funciona no mobile também)
async function exibirNotificacaoLocal(titulo, corpo, icone = NOTIFICATION_CONFIG.icon) {
    if (Notification.permission !== 'granted') return;
    try {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(titulo, {
            body: corpo,
            icon: icone,
            badge: icone,
            vibrate: [200, 100, 200],
            tag: 'agendamento-' + Date.now()
        });
    } catch (err) {
        // Fallback para navegadores antigos
        console.warn('⚠️ Fallback para Notification API:', err);
        new Notification(titulo, { body: corpo, icon: icone });
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