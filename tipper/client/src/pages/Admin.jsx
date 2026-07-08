import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, AppBar, Spinner, Empty, Avatar, Sheet } from '../components/Layout.jsx';
import { Money } from '../components/fx.jsx';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { coin, catLabel, timeAgo } from '../constants.js';

function RevenueChart({ data, t }) {
  const max = Math.max(1, ...data.map((d) => d.amount));
  const total = data.reduce((s, d) => s + d.amount, 0);
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="h-sec" style={{ marginBottom: 0 }}>{t('adm.revenue14')}</div>
        <div style={{ fontWeight: 800, color: 'var(--mint)' }}>{coin(total)}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 90 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }} title={`${d.date}: ${d.amount}`}>
            <div style={{ width: '100%', height: `${(d.amount / max) * 70}px`, minHeight: 2, borderRadius: 4, background: 'var(--grad-iris)', opacity: d.amount ? 1 : 0.25 }} />
          </div>
        ))}
      </div>
      <div className="sub" style={{ fontSize: 11, textAlign: 'center', marginTop: 8 }}>{t('adm.perDay')}</div>
    </div>
  );
}

export function Admin() {
  const navigate = useNavigate();
  const { user, showToast, t } = useApp();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('ads');
  const [sheet, setSheet] = useState(null); // {type, item}
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api.adminStats().then(setData), []);
  useEffect(() => {
    if (!user.is_admin) { showToast(t('adm.accessOnly'), 'error'); navigate('/'); return; }
    load().catch((e) => { showToast(e.message, 'error'); navigate('/'); });
  }, [user, navigate, showToast, load, t]);

  async function act(action, payload, msg) {
    setBusy(true);
    try { await api.adminAction(action, payload); showToast(msg || t('adm.done')); setSheet(null); await load(); }
    catch (e) { showToast(e.message, 'error'); } finally { setBusy(false); }
  }

  if (!data) return <Screen nav={false}><AppBar title={t('adm.title')} back="/profile" /><Spinner /></Screen>;
  const k = data.kpis;
  const KPI = ({ label, value, accent, ic }) => (
    <div className="tile"><div className="t-ic" style={{ background: accent + '22', color: accent }}>{ic}</div><div className="display" style={{ fontSize: 22, fontWeight: 700 }}>{value}</div><div className="t-s">{label}</div></div>
  );

  return (
    <Screen nav={false}>
      <AppBar title={t('adm.title')} back="/profile" subtitle={`${t('adm.connected')} ${user.full_name}`} />
      <div className="content stagger">
        <div className="balance" style={{ marginBottom: 14 }}>
          <div className="sheen" />
          <div className="lbl">{t('adm.toCash')}</div>
          <div className="amt"><Money value={k.commission_available} format={coin} /></div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12 }}>
            <span className="escrow" style={{ margin: 0 }}>{t('adm.totalCashed')} : {coin(k.commission)}</span>
            <button className="btn sm" style={{ width: 'auto', background: 'rgba(255,255,255,0.2)' }} disabled={busy || k.commission_available <= 0}
              onClick={() => act('withdraw_commission', {}, t('adm.cashedOk'))}>{t('adm.cash')}</button>
          </div>
        </div>

        <RevenueChart data={data.revenue} t={t} />

        <div className="card" style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <div><div style={{ fontWeight: 800, color: 'var(--mint)' }}>{coin(k.rev_commission || 0)}</div><div className="t-s">{t('adm.commissions')}</div></div>
          <div><div style={{ fontWeight: 800, color: 'var(--amber)' }}>{coin(k.rev_boost || 0)}</div><div className="t-s">{t('adm.boosts')}</div></div>
          <div><div style={{ fontWeight: 800, color: 'var(--iris)' }}>{coin(k.rev_subscription || 0)}</div><div className="t-s">{t('adm.subs')}</div></div>
        </div>

        <div className="bento" style={{ marginBottom: 14 }}>
          <KPI label={t('adm.users')} value={k.users} accent="#8b5cff" ic="👥" />
          <KPI label={t('adm.missions')} value={k.missions} accent="#38d6ff" ic="📋" />
          <KPI label={t('adm.completed')} value={k.completed} accent="#36e0a0" ic="✅" />
          <KPI label={t('adm.inprogress')} value={k.open} accent="#ffb020" ic="⏳" />
          <KPI label={t('adm.pro')} value={k.pro_users || 0} accent="#b79bff" ic="💎" />
          <KPI label={t('adm.disputes')} value={k.disputes_open} accent="#ff5d6c" ic="⚠️" />
        </div>

        <div className="pill-row" style={{ marginBottom: 8 }}>
          <button className={`pill ${tab === 'ads' ? 'active' : ''}`} onClick={() => setTab('ads')}>{t('adm.tabAds')} ({data.ads.length})</button>
          <button className={`pill ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>{t('adm.tabUsers')} ({data.users.length})</button>
          <button className={`pill ${tab === 'disputes' ? 'active' : ''}`} onClick={() => setTab('disputes')}>{t('adm.tabDisputes')} ({data.disputes.length})</button>
        </div>

        {tab === 'ads' && (
          <div className="card">
            {data.ads.map((a) => (
              <div key={a.id} className="row" onClick={() => setSheet({ type: 'ad', item: a })}>
                <div className="grow">
                  <div className="r-name" style={{ fontSize: 14 }}>{a.title}</div>
                  <div className="r-sub">{a.author} · {coin(a.tip_amount)} · {a.is_full ? t('adm.full') : `${a.spots_left}/3`}</div>
                </div>
                <span className={`status ${a.status}`}>{t(`status.${a.status}`)}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'users' && (
          <div className="card">
            {data.users.map((u) => (
              <div key={u.id} className="row" onClick={() => setSheet({ type: 'user', item: u })}>
                <Avatar user={u} size="s" />
                <div className="grow">
                  <div className="r-name" style={{ fontSize: 14 }}>{u.full_name} {u.verified ? '✅' : ''}{u.banned ? ' ⛔' : ''}</div>
                  <div className="r-sub">{u.email} · ⭐ {u.rating || '—'}</div>
                </div>
                <div style={{ textAlign: 'right' }}><div style={{ fontWeight: 700, fontSize: 13 }}>{coin(u.available)}</div><div className="r-sub" style={{ fontSize: 11 }}>{u.xp} XP</div></div>
              </div>
            ))}
          </div>
        )}

        {tab === 'disputes' && (data.disputes.length === 0 ? <Empty icon="✅" title={t('adm.noDispute')} /> : (
          <div className="card">
            {data.disputes.map((d) => (
              <div key={d.id} className="row" onClick={() => d.status === 'open' && setSheet({ type: 'dispute', item: d })}>
                <div className="av m" style={{ background: 'rgba(255,93,108,0.16)', color: '#ff5d6c', fontSize: 18 }}>⚠️</div>
                <div className="grow"><div className="r-name" style={{ fontSize: 14 }}>{d.ad_title}</div><div className="r-sub" style={{ whiteSpace: 'normal' }}>{d.opener_name} : « {d.reason} »</div></div>
                <span className={`status ${d.status === 'open' ? 'pending' : 'completed'}`}>{d.status === 'open' ? t('adm.open') : t('adm.resolved')}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {sheet?.type === 'ad' && (
        <Sheet onClose={() => setSheet(null)}>
          <div className="h-sec">{sheet.item.title}</div>
          <p className="sub" style={{ marginBottom: 16 }}>{sheet.item.author} · {coin(sheet.item.tip_amount)} · {t(`status.${sheet.item.status}`)}</p>
          <button className="btn ghost" style={{ marginBottom: 10 }} onClick={() => navigate(`/ads/${sheet.item.id}`)}>{t('adm.openMission')}</button>
          {!['completed', 'cancelled'].includes(sheet.item.status) && <>
            <button className="btn teal" style={{ marginBottom: 10 }} disabled={busy} onClick={() => act('pay_ad', { ad_id: sheet.item.id }, t('adm.payForced'))}>{t('adm.forcePay')}</button>
            <button className="btn danger" disabled={busy} onClick={() => act('refund_ad', { ad_id: sheet.item.id }, t('adm.refunded'))}>{t('adm.refundCancel')}</button>
          </>}
        </Sheet>
      )}

      {sheet?.type === 'user' && (
        <Sheet onClose={() => setSheet(null)}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <Avatar user={sheet.item} size="m" />
            <div><div style={{ fontWeight: 800 }}>{sheet.item.full_name}</div><div className="sub" style={{ fontSize: 13 }}>{sheet.item.email}</div></div>
          </div>
          <button className="btn ghost" style={{ marginBottom: 10 }} disabled={busy}
            onClick={() => act('verify_user', { user_id: sheet.item.id, value: !sheet.item.verified }, sheet.item.verified ? t('adm.unverifiedOk') : t('adm.verifiedOk'))}>
            {sheet.item.verified ? t('adm.unverify') : t('adm.verifyUser')}
          </button>
          <button className={`btn ${sheet.item.banned ? 'teal' : 'danger'}`} disabled={busy}
            onClick={() => act('ban_user', { user_id: sheet.item.id, value: !sheet.item.banned }, sheet.item.banned ? t('adm.reactivatedOk') : t('adm.suspendedOk'))}>
            {sheet.item.banned ? t('adm.reactivate') : t('adm.suspend')}
          </button>
        </Sheet>
      )}

      {sheet?.type === 'dispute' && (
        <Sheet onClose={() => setSheet(null)}>
          <div className="h-sec">{t('adm.resolve')}</div>
          <p className="sub" style={{ marginBottom: 16 }}>{sheet.item.ad_title} — « {sheet.item.reason} »</p>
          <button className="btn danger" style={{ marginBottom: 10 }} disabled={busy} onClick={() => act('resolve_dispute', { dispute_id: sheet.item.id, outcome: 'refund' }, t('adm.dispRefunded'))}>{t('adm.refundReq')}</button>
          <button className="btn ghost" disabled={busy} onClick={() => act('resolve_dispute', { dispute_id: sheet.item.id, outcome: 'dismiss' }, t('adm.dispClosed'))}>{t('adm.dismiss')}</button>
        </Sheet>
      )}
    </Screen>
  );
}
