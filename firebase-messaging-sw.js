// ============================================
// SEU JORGE - SERVICE WORKER DE NOTIFICAÇÕES
// ============================================

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

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

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('📩 Notificação em segundo plano:', payload);

    const notificationTitle = payload.notification?.title || 'Seu Jorge Barbearia';
    const notificationOptions = {
        body: payload.notification?.body || 'Você tem uma nova notificação!',
        icon: payload.notification?.icon || 'seujorge.png',
        badge: 'seujorge.png',
        data: payload.data || {},
        vibrate: [200, 100, 200],
        requireInteraction: true
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                for (let client of windowClients) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});