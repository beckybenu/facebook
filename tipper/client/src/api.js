const TOKEN_KEY = 'tipper_token';

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

export const api = {
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
  completeAd: (id, application_id) => request(`/ads/${id}/complete`, { method: 'POST', body: { application_id } }),
  cancelAd: (id) => request(`/ads/${id}/cancel`, { method: 'POST' }),
  // applications
  apply: (adId, message) => request(`/applications/ads/${adId}/apply`, { method: 'POST', body: { message } }),
  decide: (appId, action) => request(`/applications/${appId}/${action}`, { method: 'POST' }),
  myApplications: () => request('/applications/mine'),
  // wallet
  wallet: () => request('/wallet'),
  topup: (amount) => request('/wallet/topup', { method: 'POST', body: { amount } }),
  withdraw: (amount) => request('/wallet/withdraw', { method: 'POST', body: { amount } }),
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
