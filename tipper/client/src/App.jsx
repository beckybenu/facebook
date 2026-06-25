import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext.jsx';
import { STANDALONE } from './api.js';
import { Login, Signup } from './pages/Auth.jsx';
import { Home } from './pages/Home.jsx';
import { Categories } from './pages/Categories.jsx';
import { PostAd, Posted } from './pages/PostAd.jsx';
import { Explore } from './pages/Explore.jsx';
import { MapView } from './pages/MapView.jsx';
import { AdDetail } from './pages/AdDetail.jsx';
import { Wallet } from './pages/Wallet.jsx';
import { Notifications } from './pages/Notifications.jsx';
import { Threads, Conversation } from './pages/Messages.jsx';
import { Profile, PublicProfile, Leaderboard } from './pages/Profile.jsx';
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
  const { user } = useApp();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Signup />} />
      <Route path="/" element={<Protected><Home /></Protected>} />
      <Route path="/categories" element={<Protected><Categories /></Protected>} />
      <Route path="/post/:category" element={<Protected><PostAd /></Protected>} />
      <Route path="/posted" element={<Protected><Posted /></Protected>} />
      <Route path="/explore" element={<Protected><Explore /></Protected>} />
      <Route path="/map" element={<Protected><MapView /></Protected>} />
      <Route path="/ads/:id" element={<Protected><AdDetail /></Protected>} />
      <Route path="/wallet" element={<Protected><Wallet /></Protected>} />
      <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
      <Route path="/messages" element={<Protected><Threads /></Protected>} />
      <Route path="/messages/:userId" element={<Protected><Conversation /></Protected>} />
      <Route path="/profile" element={<Protected><Profile /></Protected>} />
      <Route path="/leaderboard" element={<Protected><Leaderboard /></Protected>} />
      <Route path="/u/:id" element={<Protected><PublicProfile /></Protected>} />
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
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
