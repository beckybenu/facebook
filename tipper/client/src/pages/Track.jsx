import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Screen, AppBar, Spinner, Avatar, Stars } from '../components/Layout.jsx';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { coin } from '../constants.js';
import { feedback } from '../sound.js';

const HELPERS = [
  { full_name: 'Maxime R.', rating: 4.9, eta: 6 },
  { full_name: 'Inès B.', rating: 5.0, eta: 4 },
  { full_name: 'Karim D.', rating: 4.8, eta: 7 },
];

export function Track() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [ad, setAd] = useState(null);
  const [phase, setPhase] = useState('searching'); // searching | matched | enroute | arrived
  const [helper] = useState(() => HELPERS[Math.floor(Math.random() * HELPERS.length)]);
  const [eta, setEta] = useState(0);
  const [progress, setProgress] = useState(0);
  const timers = useRef([]);

  useEffect(() => {
    api.getAd(id).then((d) => setAd(d.ad)).catch((e) => { showToast(e.message, 'error'); navigate('/'); });
  }, [id, navigate, showToast]);

  useEffect(() => {
    const push = (fn, ms) => timers.current.push(setTimeout(fn, ms));
    push(() => { setPhase('matched'); setEta(helper.eta); feedback('success'); }, 3200);
    push(() => { setPhase('enroute'); }, 5200);
    return () => timers.current.forEach(clearTimeout);
  }, [helper]);

  useEffect(() => {
    if (phase !== 'enroute') return;
    const total = 16000; const start = Date.now();
    const iv = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / total);
      setProgress(p);
      setEta(Math.max(0, Math.ceil(helper.eta * (1 - p))));
      if (p >= 1) { clearInterval(iv); setPhase('arrived'); feedback('coin'); }
    }, 400);
    return () => clearInterval(iv);
  }, [phase, helper]);

  if (!ad) return <Screen nav={false}><AppBar title="Tipper Now" back="/" /><Spinner /></Screen>;

  const steps = [
    { k: 'searching', ic: '📡', label: 'Recherche d\'un helper proche' },
    { k: 'matched', ic: '🤝', label: `${helper.full_name} a accepté` },
    { k: 'enroute', ic: '🛵', label: 'En route vers vous' },
    { k: 'arrived', ic: '🎉', label: 'Arrivé · pourboire libéré' },
  ];
  const order = ['searching', 'matched', 'enroute', 'arrived'];
  const idx = order.indexOf(phase);

  return (
    <Screen nav={false}>
      <AppBar title="⚡ Tipper Now" back="/" subtitle={ad.title} />
      <div className="content">
        {phase === 'searching' && (
          <div className="track-card center fade-in" style={{ marginBottom: 14 }}>
            <div className="radar">
              <div className="ring r1" /><div className="ring r2" /><div className="ring r3" />
              <div className="sweep" />
              <div className="me-dot" />
              <div className="blip" style={{ top: '18%', left: '60%' }}>🛵</div>
              <div className="blip" style={{ top: '64%', left: '24%' }}>🚶</div>
              <div className="blip" style={{ top: '70%', left: '70%' }}>🚲</div>
            </div>
            <div style={{ fontWeight: 800, fontSize: 17 }}>Recherche en cours…</div>
            <p className="sub">On ping les helpers autour de vous</p>
          </div>
        )}

        {phase !== 'searching' && (
          <div className="track-card fade-in" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <Avatar user={helper} size="m" glow />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800 }}>{helper.full_name}</div>
                <Stars value={helper.rating} />
              </div>
              <button className="iconbtn" onClick={() => showToast('Le chat est ouvert avec votre helper 💬')}>💬</button>
            </div>
            {phase !== 'arrived' ? (
              <>
                <div className="center"><span className="sub">Arrivée estimée</span><div className="eta-big">{eta} min</div></div>
                <div className="track-progress"><i style={{ width: `${Math.round(progress * 100)}%` }} /></div>
              </>
            ) : (
              <div className="center" style={{ padding: '6px 0' }}>
                <div style={{ fontSize: 48 }}>🎉</div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>Livré !</div>
                <p className="sub">{coin(ad.tip_amount)} libérés à {helper.full_name.split(' ')[0]}</p>
              </div>
            )}
          </div>
        )}

        <div className="track-card">
          <div className="track-steps">
            {steps.map((s, i) => (
              <div key={s.k} className={`ts ${i <= idx ? 'on' : ''}`}>
                <div className="tdot">{i < idx ? '✓' : s.ic}</div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {phase === 'arrived' && (
          <button className="btn coral" style={{ marginTop: 14 }} onClick={() => navigate('/')}>Terminer ✓</button>
        )}
        <p className="sub center" style={{ fontSize: 11, marginTop: 14 }}>Démo : suivi simulé pour illustrer l'expérience temps réel.</p>
      </div>
    </Screen>
  );
}
