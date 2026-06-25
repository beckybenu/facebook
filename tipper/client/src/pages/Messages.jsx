import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Screen, Header, Spinner, Empty } from '../components/Layout.jsx';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { initials, timeAgo } from '../constants.js';

export function Threads() {
  const navigate = useNavigate();
  const { showToast, refreshBadges } = useApp();
  const [threads, setThreads] = useState(null);

  useEffect(() => {
    api.threads().then((d) => { setThreads(d.threads); refreshBadges(); }).catch((e) => showToast(e.message, 'error'));
  }, [showToast, refreshBadges]);

  return (
    <Screen>
      <Header title="TIPPER" back="/" />
      <div className="content">
        <h1 className="page-title">Messages</h1>
        {!threads ? <Spinner /> : threads.length === 0 ? (
          <Empty icon="💬" title="Aucune conversation" hint="Contactez un utilisateur depuis une annonce." />
        ) : threads.map((t) => (
          <div key={t.user.id} className="list-row" onClick={() => navigate(`/messages/${t.user.id}`)} style={{ cursor: 'pointer' }}>
            <div className="avatar">{initials(t.user.full_name)}</div>
            <div className="grow">
              <div className="name">{t.user.full_name}</div>
              <div className="sub">{t.last_message}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <span className="time">{timeAgo(t.last_at)}</span>
              {t.unread > 0 && <span className="nav-badge" style={{ position: 'static' }}>{t.unread}</span>}
            </div>
          </div>
        ))}
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
    try {
      const d = await api.thread(userId);
      setMsgs(d.messages); setOther(d.user);
      refreshBadges();
    } catch (e) { showToast(e.message, 'error'); }
  }, [userId, showToast, refreshBadges]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(load, 5000); // polling léger
    return () => clearInterval(t);
  }, [load]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const body = text; setText('');
    try { await api.sendMessage({ receiver_id: userId, body }); load(); }
    catch (e) { showToast(e.message, 'error'); }
  }

  const myId = JSON.parse(atob((localStorage.getItem('tipper_token') || 'x.e30=.x').split('.')[1])).id;

  return (
    <Screen>
      <Header title={other?.full_name || 'Message'} back="/messages" />
      <div className="content" style={{ display: 'flex', flexDirection: 'column' }}>
        {!msgs ? <Spinner /> : msgs.length === 0 ? (
          <Empty icon="👋" title="Démarrez la conversation" />
        ) : (
          <div style={{ flex: 1 }}>
            {msgs.map((m) => (
              <div key={m.id} className={`bubble ${m.sender_id === myId ? 'me' : 'them'}`}>{m.body}</div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
        <form className="msg-bar" onSubmit={send}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Votre message…" />
          <button className="btn sm magenta" style={{ width: 'auto' }}>Envoyer</button>
        </form>
      </div>
    </Screen>
  );
}
