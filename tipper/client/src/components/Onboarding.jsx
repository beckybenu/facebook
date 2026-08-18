import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { TwoChoices } from './Explain.jsx';

// Parcours de bienvenue : explique Tipper en 4 écrans, puis demande à la
// personne ce qu'elle veut faire et l'emmène directement au bon endroit.
// Rejouable depuis le menu (« Comment ça marche ? »).
const SLIDES = [
  { ic: '👋', tint: '#ff7a45', k: 's1' },
  { ic: '📣', tint: '#8b5cff', k: 's2' },
  { ic: '🙌', tint: '#36e0a0', k: 's3' },
  { ic: '🔒', tint: '#38d6ff', k: 's4' },
];

export function Onboarding() {
  const { t, showOnboarding, completeOnboarding } = useApp();
  const navigate = useNavigate();
  const [i, setI] = useState(0);
  useEffect(() => { if (showOnboarding) setI(0); }, [showOnboarding]);
  if (!showOnboarding) return null;

  // i === SLIDES.length : écran final de choix (demander / aider)
  const choosing = i === SLIDES.length;
  const go = (to) => { completeOnboarding(); navigate(to); };

  if (choosing) {
    return (
      <div className="ob-overlay" role="dialog" aria-modal="true">
        <div className="ob-card fade-in">
          <button className="ob-skip" onClick={completeOnboarding}>{t('ob.skip')}</button>
          <div className="ob-art" style={{ background: '#ff7a451f', color: '#ff7a45', boxShadow: '0 16px 40px #ff7a4533' }}>👋</div>
          <h2 className="ob-title">{t('ux.ob.welcome')}</h2>
          <p className="ob-desc">{t('ux.ob.choice')}</p>
          <div style={{ margin: '18px 0 0' }}>
            <TwoChoices onNeed={() => go('/categories')} onHelp={() => go('/explore')} />
          </div>
        </div>
      </div>
    );
  }

  const s = SLIDES[i];
  return (
    <div className="ob-overlay" role="dialog" aria-modal="true">
      <div className="ob-card fade-in" key={i}>
        <button className="ob-skip" onClick={completeOnboarding}>{t('ob.skip')}</button>
        <div className="ob-art" style={{ background: s.tint + '1f', color: s.tint, boxShadow: `0 16px 40px ${s.tint}33` }}>{s.ic}</div>
        <h2 className="ob-title">{t(`ob.${s.k}.t`)}</h2>
        <p className="ob-desc">{t(`ob.${s.k}.d`)}</p>
        <div className="ob-dots">
          {SLIDES.map((_, n) => (
            <span key={n} className={n === i ? 'on' : ''} onClick={() => setI(n)} />
          ))}
        </div>
        <button className="btn coral" onClick={() => setI(i + 1)}>{t('ob.next')}</button>
      </div>
    </div>
  );
}
