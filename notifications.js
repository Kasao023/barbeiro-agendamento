// ============================================
// SEU JORGE - SISTEMA DE NOTIFICAÇÕES (CORRIGIDO)
// ============================================

const NOTIFICATION_CONFIG = {
    vapidKey: 'BMNlqPRApT_o_nLxDy5H2oWEe0lgD8ttq5i8KYfPEaCm0dAAD6v82GjrKl86t_HbulbLGUNF_23jS4npdEiNuik',
    icon: 'seujorge.png',
    swPath: 'firebase-messaging-sw.js',
    swScope: './'
};

let __messagingInstance = null;
let __swRegistration = null;

// Registra o SW uma única vez e reutiliza
async function obterServiceWorkerRegistration() {
    if (__swRegistration) return __swRegistration;
    if (!('serviceWorker' in navigator)) {
        throw new Error('Service Worker não suportado neste navegador.');
    }
    try {
        __swRegistration = await navigator.serviceWorker.register(
            NOTIFICATION_CONFIG.swPath,
            { scope: NOTIFICATION_CONFIG.swScope }
        );
        await navigator.serviceWorker.ready;
        console.log('✅ SW registrado com scope:', __swRegistration.scope);
        return __swRegistration;
    } catch (err) {
        console.error('❌ Erro ao registrar SW:', err);
        throw err;
    }
}

function getMessaging() {
    if (!__messagingInstance) {
        __messagingInstance = firebase.messaging();

        // Listener de refresh do token
        __messagingInstance.onTokenRefresh(async () => {
            try {
                const reg = await obterServiceWorkerRegistration();
                const newToken = await __messagingInstance.getToken({
                    vapidKey: NOTIFICATION_CONFIG.vapidKey,
                    serviceWorkerRegistration: reg   // ← CRUCIAL
                });
                if (newToken) {
                    await salvarTokenNoFirebase(newToken, 'cliente');
                    console.log('🔄 Token atualizado:', newToken.substring(0, 30) + '...');
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
        const reg = await obterServiceWorkerRegistration();

        const messaging = getMessaging();
        const token = await messaging.getToken({
            vapidKey: NOTIFICATION_CONFIG.vapidKey,
            serviceWorkerRegistration: reg   // ← CRUCIAL
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

    // 1. Registra o SW
    try {
        await obterServiceWorkerRegistration();
    } catch (err) {
        alert('❌ Erro ao registrar Service Worker:\n\n' + err.message);
        return false;
    }

    // 2. Pede permissão
    const permitido = await solicitarPermissaoNotificacao();
    if (!permitido) return false;

    // 3. Pega e salva token
    const token = await obterTokenNotificacao();
    if (token) await salvarTokenNoFirebase(token, tipo);

    return true;
}

// Mostra notificação local via SW (funciona no mobile também)
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