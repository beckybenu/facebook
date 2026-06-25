import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, AppBar, Spinner, Empty, Avatar } from '../components/Layout.jsx';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { coin, catLabel, STATUS_LABEL, timeAgo } from '../constants.js';

export function Admin() {
  const navigate = useNavigate();
  const { user, showToast } = useApp();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('ads');

  useEffect(() => {
    if (!user.is_admin) { showToast('Accès réservé à l\'administrateur', 'error'); navigate('/'); return; }
    api.adminStats().then(setData).catch((e) => { showToast(e.message, 'error'); navigate('/'); });
  }, [user, navigate, showToast]);

  if (!data) return <Screen nav={false}><AppBar title="Back-office" back="/profile" /><Spinner /></Screen>;
  const k = data.kpis;

  const KPI = ({ label, value, accent, ic }) => (
    <div className="tile">
      <div className="t-ic" style={{ background: accent + '22', color: accent }}>{ic}</div>
      <div className="display" style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
      <div className="t-s">{label}</div>
    </div>
  );

  return (
    <Screen nav={false}>
      <AppBar title="🛠️ Back-office admin" back="/profile" subtitle={`Connecté : ${user.full_name}`} />
      <div className="content stagger">
        <div className="balance" style={{ marginBottom: 14 }}>
          <div className="sheen" />
          <div className="lbl">Commissions encaissées (10%)</div>
          <div className="amt">{coin(k.commission)}</div>
          <div className="escrow">💰 GMV pourboires : {coin(k.gmv)}</div>
        </div>

        <div className="bento" style={{ marginBottom: 14 }}>
          <KPI label="Utilisateurs" value={k.users} accent="#8b5cff" ic="👥" />
          <KPI label="Missions" value={k.missions} accent="#38d6ff" ic="📋" />
          <KPI label="Terminées" value={k.completed} accent="#36e0a0" ic="✅" />
          <KPI label="En cours" value={k.open} accent="#ffb020" ic="⏳" />
          <KPI label="Litiges ouverts" value={k.disputes_open} accent="#ff5d6c" ic="⚠️" />
          <KPI label="Coins en circulation" value={Math.round(k.coins_in_circulation)} accent="#ff7a45" ic="🪙" />
        </div>

        <div className="pill-row" style={{ marginBottom: 8 }}>
          <button className={`pill ${tab === 'ads' ? 'active' : ''}`} onClick={() => setTab('ads')}>Annonces ({data.ads.length})</button>
          <button className={`pill ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>Utilisateurs ({data.users.length})</button>
          <button className={`pill ${tab === 'disputes' ? 'active' : ''}`} onClick={() => setTab('disputes')}>Litiges ({data.disputes.length})</button>
        </div>

        {tab === 'ads' && (
          <div className="card">
            {data.ads.map((a) => (
              <div key={a.id} className="row" onClick={() => navigate(`/ads/${a.id}`)}>
                <div className="grow">
                  <div className="r-name" style={{ fontSize: 14 }}>{a.title}</div>
                  <div className="r-sub">{a.author} · {catLabel(a.category)} · {coin(a.tip_amount)} · {a.is_full ? '✋ complet' : `${a.spots_left}/3`}</div>
                </div>
                <span className={`status ${a.status}`}>{STATUS_LABEL[a.status]}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'users' && (
          <div className="card">
            {data.users.map((u) => (
              <div key={u.id} className="row" onClick={() => navigate(`/u/${u.id}`)}>
                <Avatar user={u} size="s" />
                <div className="grow">
                  <div className="r-name" style={{ fontSize: 14 }}>{u.full_name} {u.verified ? '✅' : ''}</div>
                  <div className="r-sub">{u.email} · {u.city || '—'} · ⭐ {u.rating || '—'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{coin(u.available)}</div>
                  <div className="r-sub" style={{ fontSize: 11 }}>{u.xp} XP · {u.points} pts</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'disputes' && (data.disputes.length === 0 ? <Empty icon="✅" title="Aucun litige" /> : (
          <div className="card">
            {data.disputes.map((d) => (
              <div key={d.id} className="row" onClick={() => navigate(`/ads/${d.ad_id}`)}>
                <div className="av m" style={{ background: 'rgba(255,93,108,0.16)', color: '#ff5d6c', fontSize: 18 }}>⚠️</div>
                <div className="grow">
                  <div className="r-name" style={{ fontSize: 14 }}>{d.ad_title}</div>
                  <div className="r-sub" style={{ whiteSpace: 'normal' }}>{d.opener_name} : « {d.reason} »</div>
                </div>
                <span className="r-time">{timeAgo(d.created_at)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Screen>
  );
}
