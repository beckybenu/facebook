import { api, STANDALONE } from './api.js';

const SW_PATH = `${import.meta.env.BASE_URL}sw.js`;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register(SW_PATH);
  } catch (e) {
    console.warn('SW registration failed', e);
    return null;
  }
}

// Demande la permission et abonne aux push. Retourne true si activé.
export async function enablePush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    throw new Error('Notifications non supportées sur cet appareil');
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Permission refusée');

  const reg = await navigator.serviceWorker.ready;

  // Démo statique : pas de serveur push. On confirme avec une notification locale.
  if (STANDALONE) {
    reg.showNotification('🔔 Notifications activées', {
      body: 'Vous recevrez vos alertes Tipper ici.',
      icon: `${import.meta.env.BASE_URL}icon.svg`,
    });
    return true;
  }

  const { key } = await api.vapidKey();
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    });
  }
  await api.subscribePush(sub);
  return true;
}

export function pushStatus() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}
