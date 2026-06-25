import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, AppBar, Spinner, Empty } from '../components/Layout.jsx';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { timeAgo } from '../constants.js';
import { enablePush, pushStatus } from '../push.js';

const ICON = {
  new_application: { e: '🙋', bg: '#ffe9e3' }, application_accepted: { e: '✅', bg: '#e4f7f3' },
  application_rejected: { e: '❌', bg: '#fdecec' }, tip_received: { e: '💰', bg: '#e4f7f3' },
  mission_delivered: { e: '📦', bg: '#e7eeff' }, new_message: { e: '💬', bg: '#eee9ff' },
  new_review: { e: '⭐', bg: '#fff1d9' }, points_earned: { e: '🎯', bg: 'rgba(139,92,255,0.16)' },
  dispute: { e: '⚠️', bg: 'rgba(255,93,108,0.16)' },
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
      await api.readNotifications(); setUnreadNotif(0); refreshBadges();
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
      <AppBar title="Notifications" back="/" />
      <div className="content">
        {pStatus !== 'granted' && pStatus !== 'unsupported' && (
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fffaf8', borderColor: '#ffe1d8' }}>
            <span style={{ fontSize: 22 }}>🔔</span>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14 }}>Alertes en temps réel</div><div className="sub" style={{ fontSize: 12.5 }}>Candidatures, pourboires, messages…</div></div>
            <button className="btn coral sm" onClick={activate}>Activer</button>
          </div>
        )}
        {!items ? <Spinner /> : items.length === 0 ? <Empty icon="🔔" title="Aucune notification" hint="Vos alertes apparaîtront ici" /> : (
          <div className="card">
            {items.map((n) => {
              const ic = ICON[n.type] || { e: '🔔', bg: 'var(--line-soft)' };
              return (
                <div key={n.id} className="row" onClick={() => open(n)}>
                  <div className="av m" style={{ background: ic.bg, color: 'var(--ink)', fontSize: 18 }}>{ic.e}</div>
                  <div className="grow">
                    <div className="r-name" style={{ fontSize: 14 }}>{n.title}</div>
                    <div className="r-sub" style={{ whiteSpace: 'normal' }}>{n.body}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span className="r-time">{timeAgo(n.created_at)}</span>
                    {!n.read && <span className="unread" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Screen>
  );
}
