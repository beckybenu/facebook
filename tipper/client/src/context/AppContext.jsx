import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api, getToken, setToken, STANDALONE } from '../api.js';
import { feedback } from '../sound.js';
import { detectLang, makeT } from '../i18n.js';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [unreadMsg, setUnreadMsg] = useState(0);
  const toastTimer = useRef(null);

  // Préférences : thème, son, haptique
  const [theme, setTheme] = useState(() => localStorage.getItem('tipper_theme') || 'light');
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem('tipper_sound') !== '0');
  const [hapticOn, setHapticOn] = useState(() => localStorage.getItem('tipper_haptic') !== '0');
  const [lang, setLangState] = useState(detectLang);
  const t = makeT(lang);
  const setLang = useCallback((l) => { localStorage.setItem('tipper_lang', l); setLangState(l); document.documentElement.lang = l; }, []);

  // Onboarding : parcours de bienvenue affiché au 1er lancement, rejouable depuis le menu
  const [showOnboarding, setShowOnboarding] = useState(false);
  const completeOnboarding = useCallback(() => { localStorage.setItem('tipper_onboarded', '1'); setShowOnboarding(false); }, []);
  const openOnboarding = useCallback(() => setShowOnboarding(true), []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f6f5f1' : '#08080d');
    localStorage.setItem('tipper_theme', theme);
  }, [theme]);
  const toggleTheme = useCallback(() => setTheme((t) => (t === 'light' ? 'dark' : 'light')), []);
  const toggleSound = useCallback(() => setSoundOn((s) => { const n = !s; localStorage.setItem('tipper_sound', n ? '1' : '0'); return n; }), []);
  const toggleHaptic = useCallback(() => setHapticOn((s) => { const n = !s; localStorage.setItem('tipper_haptic', n ? '1' : '0'); return n; }), []);

  const showToast = useCallback((message, kind = 'ok') => {
    setToast({ message, kind });
    feedback(kind === 'error' ? 'error' : 'tap');
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const refreshBadges = useCallback(async () => {
    if (!getToken()) return;
    try {
      const [n, t] = await Promise.all([api.notifications(), api.threads()]);
      setUnreadNotif(n.unread || 0);
      setUnreadMsg((t.threads || []).reduce((s, x) => s + (x.unread || 0), 0));
    } catch { /* ignore */ }
  }, []);

  const loadUser = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    try {
      const { user } = await api.me();
      setUser(user);
      refreshBadges();
    } catch {
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, [refreshBadges]);

  useEffect(() => { loadUser(); }, [loadUser]);

  // Affiche le parcours de bienvenue la première fois qu'un utilisateur est connecté
  useEffect(() => {
    if (user && !localStorage.getItem('tipper_onboarded')) setShowOnboarding(true);
  }, [user]);

  // Rafraîchit les badges périodiquement (fallback si push indisponible)
  useEffect(() => {
    if (!user) return;
    const t = setInterval(refreshBadges, 20000);
    return () => clearInterval(t);
  }, [user, refreshBadges]);

  // Temps réel (SSE) en mode full-stack : notifications instantanées
  useEffect(() => {
    if (STANDALONE || !user) return;
    const token = getToken();
    if (!token || typeof EventSource === 'undefined') return;
    const es = new EventSource(`/api/stream?token=${encodeURIComponent(token)}`);
    es.addEventListener('notification', (e) => {
      refreshBadges();
      try { const n = JSON.parse(e.data); if (n.title) setToast({ message: n.title, kind: 'ok' }); } catch { /* ignore */ }
    });
    return () => es.close();
  }, [user, refreshBadges]);

  const login = useCallback(async (email, password) => {
    const { token, user } = await api.login({ email, password });
    setToken(token); setUser(user); refreshBadges();
    return user;
  }, [refreshBadges]);

  const signup = useCallback(async (payload) => {
    const { token, user } = await api.signup(payload);
    setToken(token); setUser(user);
    return user;
  }, []);

  const logout = useCallback(() => {
    setToken(null); setUser(null); setUnreadNotif(0); setUnreadMsg(0);
  }, []);

  // Géolocalisation -> enregistre la position de l'utilisateur
  const captureLocation = useCallback(async () => {
    if (!navigator.geolocation) throw new Error('Géolocalisation non disponible');
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            const { user } = await api.setLocation({ lat: latitude, lng: longitude });
            setUser(user);
            resolve(user);
          } catch (e) { reject(e); }
        },
        (err) => reject(new Error(err.message || 'Position refusée')),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, []);

  const value = {
    user, setUser, loading, login, signup, logout,
    toast, showToast,
    unreadNotif, unreadMsg, setUnreadNotif, refreshBadges,
    captureLocation,
    theme, toggleTheme, soundOn, toggleSound, hapticOn, toggleHaptic,
    lang, setLang, t,
    showOnboarding, completeOnboarding, openOnboarding,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
