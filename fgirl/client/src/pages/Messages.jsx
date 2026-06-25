import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function Messages() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [thread, setThread] = useState([]);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef(null);

  const loadConversations = () => api.get('/messages').then(setConversations).catch(() => {});

  useEffect(() => { loadConversations(); }, []);

  useEffect(() => {
    if (!userId) { setThread([]); return; }
    let active = true;
    const load = () => api.get(`/messages/${userId}`).then((t) => active && setThread(t)).catch(() => {});
    load();
    const id = setInterval(load, 5000);
    return () => { active = false; clearInterval(id); };
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  const send = async (e) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    const msg = await api.post(`/messages/${userId}`, { body }).catch(() => null);
    if (msg) setThread((t) => [...t, msg]);
    loadConversations();
  };

  const activeConv = conversations.find((c) => String(c.userId) === String(userId));

  return (
    <div className="container">
      <h1 className="page-title">Messages</h1>
      <div className="messenger">
        <aside className="conv-list">
          {conversations.length === 0 && <p className="muted small">Aucune conversation.</p>}
          {conversations.map((c) => (
            <button
              key={c.userId}
              className={`conv ${String(c.userId) === String(userId) ? 'active' : ''}`}
              onClick={() => navigate(`/messages/${c.userId}`)}
            >
              <span className="conv-name">{c.displayName}</span>
              <span className="conv-last">{c.lastMessage}</span>
              {c.unread > 0 && <span className="badge">{c.unread}</span>}
            </button>
          ))}
        </aside>

        <section className="thread">
          {!userId && <p className="muted thread-empty">Sélectionnez une conversation.</p>}
          {userId && (
            <>
              <header className="thread-head">{activeConv?.displayName || 'Conversation'}</header>
              <div className="thread-body">
                {thread.map((m) => (
                  <div key={m.id} className={`bubble ${m.mine ? 'mine' : 'theirs'}`}>
                    {m.body}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <form className="thread-form" onSubmit={send}>
                <input
                  placeholder="Écrire un message…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button className="btn btn-primary" type="submit">Envoyer</button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
