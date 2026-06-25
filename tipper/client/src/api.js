import { localApi } from './localApi.js';

const TOKEN_KEY = 'tipper_token';

// Mode "standalone" : aucune API serveur (ex. démo statique GitHub Pages).
// Toute la logique tourne dans le navigateur via localStorage.
export const STANDALONE =
  import.meta.env.VITE_STANDALONE === '1' ||
  (typeof location !== 'undefined' && location.hostname.endsWith('github.io'));

export function getToken() { return localStorage.getItem(TOKEN_KEY); }
export function setToken(t) { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); }

async function request(path, { method = 'GET', body, isForm } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload = body;
  if (body && !isForm) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(`/api${path}`, { method, headers, body: payload });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Une erreur est survenue');
  return data;
}

export const api = STANDALONE ? localApi : {
  // auth
  signup: (b) => request('/auth/signup', { method: 'POST', body: b }),
  login: (b) => request('/auth/login', { method: 'POST', body: b }),
  me: () => request('/auth/me'),
  // users
  updateProfile: (b) => request('/users/me', { method: 'PATCH', body: b }),
  setLocation: (b) => request('/users/me/location', { method: 'POST', body: b }),
  getUser: (id) => request(`/users/${id}`),
  // ads
  listAds: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/ads${q ? '?' + q : ''}`);
  },
  getAd: (id) => request(`/ads/${id}`),
  createAd: (form) => request('/ads', { method: 'POST', body: form, isForm: true }),
  toggleSave: (id) => request(`/ads/${id}/save`, { method: 'POST' }),
  markDelivered: (id, application_id) => request(`/ads/${id}/deliver`, { method: 'POST', body: { application_id } }),
  confirmCompletion: (id, application_id) => request(`/ads/${id}/confirm`, { method: 'POST', body: { application_id } }),
  cancelAd: (id) => request(`/ads/${id}/cancel`, { method: 'POST' }),
  rate: (b) => request('/reviews', { method: 'POST', body: b }),
  leaderboard: (params = {}) => request(`/leaderboard?${new URLSearchParams(params)}`),
  adminStats: () => request('/admin/stats'),
  adminAction: (action, payload) => request('/admin/action', { method: 'POST', body: { action, ...payload } }),
  // applications
  apply: (adId, message) => request(`/applications/ads/${adId}/apply`, { method: 'POST', body: { message } }),
  decide: (appId, action) => request(`/applications/${appId}/${action}`, { method: 'POST' }),
  myApplications: () => request('/applications/mine'),
  // wallet
  wallet: () => request('/wallet'),
  topup: (amount) => request('/wallet/topup', { method: 'POST', body: { amount } }),
  withdraw: (amount) => request('/wallet/withdraw', { method: 'POST', body: { amount } }),
  exchangePoints: (coins) => request('/wallet/exchange', { method: 'POST', body: { coins } }),
  boostAd: (id) => request(`/ads/${id}/boost`, { method: 'POST' }),
  subscribePro: () => request('/wallet/pro', { method: 'POST' }),
  checkout: (amount) => request('/wallet/checkout', { method: 'POST', body: { amount } }),
  dispute: (id, reason) => request(`/ads/${id}/dispute`, { method: 'POST', body: { reason } }),
  // notifications
  vapidKey: () => request('/notifications/vapid-key'),
  subscribePush: (subscription) => request('/notifications/subscribe', { method: 'POST', body: { subscription } }),
  notifications: () => request('/notifications'),
  readNotifications: (id) => request('/notifications/read', { method: 'POST', body: id ? { id } : {} }),
  // messages
  threads: () => request('/messages/threads'),
  thread: (userId) => request(`/messages/with/${userId}`),
  sendMessage: (b) => request('/messages/send', { method: 'POST', body: b }),
};
