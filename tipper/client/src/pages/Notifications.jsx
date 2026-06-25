import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, Header, Spinner, Empty } from '../components/Layout.jsx';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { timeAgo } from '../constants.js';
import { enablePush, pushStatus } from '../push.js';

const ICONS = {
  new_application: '🙋', application_accepted: '✅', application_rejected: '❌',
  tip_received: '💰', new_message: '💬', ad_completed: '🎉',
};

export function Notifications() {
  const navigate = useNavigate();
  const { showToast, setUnreadNotif, refreshBadges } = useApp();
  const [items, setItems] = useState(null);
  const [pStatus, setPStatus] = useState(pushStatus());

  const load = useCallback(async () => {
    try {
      const { notifications } = await api.notifications();
      setItems(notifications);
      await api.readNotifications();
      setUnreadNotif(0);
      refreshBadges();
    } catch (e) { showToast(e.message, 'error'); }
  }, [showToast, setUnreadNotif, refreshBadges]);

  useEffect(() => { load(); }, [load]);

  async function activate() {
    try { await enablePush(); setPStatus('granted'); showToast('Notifications activées 🔔'); }
    catch (e) { showToast(e.message, 'error'); setPStatus(pushStatus()); }
  }

  function open(n) {
    if (n.data?.fromUserId) navigate(`/messages/${n.data.fromUserId}`);
    else if (n.data?.adId) navigate(`/ads/${n.data.adId}`);
  }

  return (
    <Screen>
      <Header title="TIPPER" back="/" />
      <div className="content">
        <h1 className="page-title">Notifications</h1>

        {pStatus !== 'granted' && pStatus !== 'unsupported' && (
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14 }}>🔔 Activez les alertes push en temps réel</span>
            <button className="btn sm" onClick={activate}>Activer</button>
          </div>
        )}

        {!items ? <Spinner /> : items.length === 0 ? (
          <Empty icon="🔔" title="Aucune notification" hint="Vos alertes apparaîtront ici." />
        ) : items.map((n) => (
          <div key={n.id} className="list-row" onClick={() => open(n)} style={{ cursor: 'pointer' }}>
            <div className="avatar" style={{ background: n.read ? 'var(--line)' : 'var(--indigo-light)' }}>{ICONS[n.type] || '🔔'}</div>
            <div className="grow">
              <div className="name">{n.title}</div>
              <div className="sub" style={{ whiteSpace: 'normal' }}>{n.body}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <span className="time">{timeAgo(n.created_at)}</span>
              {!n.read && <span className="unread-dot" />}
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}
