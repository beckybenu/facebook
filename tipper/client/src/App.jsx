import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext.jsx';
import { STANDALONE } from './api.js';
import { Login, Signup } from './pages/Auth.jsx';
import { Role } from './pages/Role.jsx';
import { Categories } from './pages/Categories.jsx';
import { PostAd, Posted } from './pages/PostAd.jsx';
import { Feed } from './pages/Feed.jsx';
import { AdDetail } from './pages/AdDetail.jsx';
import { Wallet } from './pages/Wallet.jsx';
import { Notifications } from './pages/Notifications.jsx';
import { Threads, Conversation } from './pages/Messages.jsx';
import { Profile, PublicProfile } from './pages/Profile.jsx';
import { Spinner } from './components/Layout.jsx';

function Protected({ children }) {
  const { user, loading } = useApp();
  if (loading) return <div className="app-shell"><Spinner /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return <div className={`toast ${toast.kind}`}>{toast.message}</div>;
}

function Router() {
  const { user, loading } = useApp();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Signup />} />
      <Route path="/" element={<Protected><Role /></Protected>} />
      <Route path="/categories" element={<Protected><Categories /></Protected>} />
      <Route path="/post/:category" element={<Protected><PostAd /></Protected>} />
      <Route path="/posted" element={<Protected><Posted /></Protected>} />
      <Route path="/feed" element={<Protected><Feed /></Protected>} />
      <Route path="/ads/:id" element={<Protected><AdDetail /></Protected>} />
      <Route path="/wallet" element={<Protected><Wallet /></Protected>} />
      <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
      <Route path="/messages" element={<Protected><Threads /></Protected>} />
      <Route path="/messages/:userId" element={<Protected><Conversation /></Protected>} />
      <Route path="/profile" element={<Protected><Profile /></Protected>} />
      <Route path="/u/:id" element={<Protected><PublicProfile /></Protected>} />
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  // HashRouter sur GitHub Pages (pas de réécriture serveur), BrowserRouter sinon.
  const RouterShell = STANDALONE ? HashRouter : BrowserRouter;
  return (
    <AppProvider>
      <RouterShell>
        <Router />
        <Toast />
      </RouterShell>
    </AppProvider>
  );
}
