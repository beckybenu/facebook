import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Screen, AppBar, Spinner, Empty, Avatar } from '../components/Layout.jsx';
import { api, getToken } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { timeAgo } from '../constants.js';

export function Threads() {
  const navigate = useNavigate();
  const { showToast, refreshBadges, unreadNotif } = useApp();
  const [threads, setThreads] = useState(null);

  useEffect(() => {
    api.threads().then((d) => { setThreads(d.threads); refreshBadges(); }).catch((e) => showToast(e.message, 'error'));
  }, [showToast, refreshBadges]);

  return (
    <Screen>
      <AppBar title="Boîte de réception" back="/"
        right={<button className="iconbtn" onClick={() => navigate('/notifications')}>🔔{unreadNotif > 0 && <span className="dot-badge">{unreadNotif}</span>}</button>} />
      <div className="content">
        {!threads ? <Spinner /> : threads.length === 0 ? (
          <Empty icon="💬" title="Aucune conversation" hint="Contactez un membre depuis une mission"
            action={<button className="btn coral sm" onClick={() => navigate('/explore')}>Explorer</button>} />
        ) : (
          <div className="card">
            {threads.map((t) => (
              <div key={t.user.id} className="row" onClick={() => navigate(`/messages/${t.user.id}`)}>
                <Avatar user={t.user} size="m" />
                <div className="grow">
                  <div className="r-name">{t.user.full_name}</div>
                  <div className="r-sub">{t.last_message}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <span className="r-time">{timeAgo(t.last_at)}</span>
                  {t.unread > 0 && <span className="dot-badge" style={{ position: 'static', border: 'none' }}>{t.unread}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Screen>
  );
}

export function Conversation() {
  const { userId } = useParams();
  const { showToast, refreshBadges } = useApp();
  const [msgs, setMsgs] = useState(null);
  const [other, setOther] = useState(null);
  const [text, setText] = useState('');
  const bottomRef = useRef();

  const load = useCallback(async () => {
    try { const d = await api.thread(userId); setMsgs(d.messages); setOther(d.user); refreshBadges(); }
    catch (e) { showToast(e.message, 'error'); }
  }, [userId, showToast, refreshBadges]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setInterval(load, 5000); return () => clearInterval(t); }, [load]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const body = text; setText('');
    try { await api.sendMessage({ receiver_id: userId, body }); load(); }
    catch (e) { showToast(e.message, 'error'); }
  }

  let myId = '';
  try { myId = JSON.parse(atob((getToken() || 'x.e30.x').split('.')[1])).id; } catch { /* ignore */ }

  return (
    <Screen nav={false}>
      <AppBar title={other?.full_name || 'Message'} back="/messages" />
      <div className="content" style={{ display: 'flex', flexDirection: 'column' }}>
        {!msgs ? <Spinner /> : msgs.length === 0 ? <Empty icon="👋" title="Démarrez la conversation" /> : (
          <div style={{ flex: 1 }}>
            {msgs.map((m) => <div key={m.id} className={`bubble ${m.sender_id === myId ? 'me' : 'them'}`}>{m.body}</div>)}
            <div ref={bottomRef} />
          </div>
        )}
        <form className="msgbar" onSubmit={send}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Votre message…" />
          <button className="iconbtn" style={{ background: 'var(--coral)', color: '#fff' }}>➤</button>
        </form>
      </div>
    </Screen>
  );
}
