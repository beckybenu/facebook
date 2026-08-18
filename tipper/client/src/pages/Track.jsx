import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Screen, AppBar, Spinner, Avatar, Stars } from '../components/Layout.jsx';
import { Journey, journeyStep } from '../components/Explain.jsx';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { coin } from '../constants.js';

// Suivi d'une demande qui vient d'être publiée.
// Affiche l'état RÉEL : tant que personne n'a proposé son aide, on le dit —
// et on rappelle que l'argent est seulement réservé, pas versé.
export function Track() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast, t } = useApp();
  const [ad, setAd] = useState(null);
  const timer = useRef(null);

  const load = useCallback(async () => {
    try { const { ad } = await api.getAd(id); setAd(ad); }
    catch (e) { showToast(e.message, 'error'); navigate('/'); }
  }, [id, navigate, showToast]);

  useEffect(() => { load(); }, [load]);

  // Rafraîchit tant que la demande attend des propositions
  useEffect(() => {
    if (!ad || ad.status !== 'open') return;
    timer.current = setInterval(load, 5000);
    return () => clearInterval(timer.current);
  }, [ad, load]);

  if (!ad) return <Screen nav={false}><AppBar title="" back="/" /><Spinner /></Screen>;

  const props = ad.applications || [];
  const hasProps = props.length > 0;
  const step = journeyStep(ad);

  return (
    <Screen nav={false}>
      <AppBar title={ad.title} back="/" />
      <div className="content">
        {/* État réel de la demande */}
        <div className="card center" style={{ paddingTop: 24, paddingBottom: 24 }}>
          {!hasProps ? (
            <>
              <div className="pulse-dot" />
              <div style={{ fontWeight: 800, fontSize: 17, marginTop: 14 }}>{t('ux.tr.live')}</div>
              <p className="sub" style={{ marginTop: 6 }}>{t('ux.tr.waiting')}</p>
            </>
          ) : (
            <>
              <div style={{ fontSize: 44 }}>🙌</div>
              <div style={{ fontWeight: 800, fontSize: 17, marginTop: 6 }}>
                {props.length} {t(props.length > 1 ? 'ux.proposals' : 'ux.proposal').toLowerCase()}
              </div>
              <p className="sub" style={{ marginTop: 4 }}>{t('ux.tr.compare')}</p>
              {/* Aperçu des personnes qui ont réellement proposé leur aide */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '16px 0 4px', textAlign: 'left' }}>
                {props.slice(0, 3).map((p) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar user={p.applicant} size="s" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{p.applicant.full_name}</div>
                      <Stars value={p.applicant.rating} count={p.applicant.rating_count} />
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn coral" style={{ marginTop: 14 }} onClick={() => navigate(`/ads/${id}`)}>{t('ux.tr.see')}</button>
            </>
          )}
        </div>

        {/* Où j'en suis */}
        <div className="card">
          <Journey step={step} />
        </div>

        {/* Ce qui se passe pour l'argent, en toutes lettres */}
        <div className="explain">
          <div className="ex-head">🔒 {t('ux.tr.reserved')} · {coin(ad.tip_amount)}</div>
          <p className="ex-p" style={{ margin: 0 }}>{t('ux.pay.s2')}</p>
        </div>

        {!hasProps && (
          <button className="btn ghost" onClick={() => navigate(`/ads/${id}`)}>{t('ux.tr.see')}</button>
        )}
      </div>
    </Screen>
  );
}
