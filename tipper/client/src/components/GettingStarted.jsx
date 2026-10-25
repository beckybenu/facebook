import { useApp } from '../context/AppContext.jsx';

// Checklist de démarrage : 3 étapes simples pour qu'un nouvel utilisateur
// soit opérationnel. Disparaît une fois les 3 étapes faites.
export function GettingStarted({ posted, onLocate, onVerify, onPost }) {
  const { user, t } = useApp();
  const steps = [
    { key: 'pos', ic: '📍', done: !!user.lat, label: t('gs.pos'), desc: t('gs.posD'), onClick: onLocate },
    { key: 'verif', ic: '🪪', done: !!user.verified, label: t('gs.verif'), desc: t('gs.verifD'), onClick: onVerify },
    { key: 'post', ic: '📣', done: !!posted, label: t('gs.post'), desc: t('gs.postD'), onClick: onPost },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount >= steps.length) return null;

  return (
    <div className="gs-card">
      <div className="gs-head">
        <div>
          <div className="gs-title">🚀 {t('gs.title')}</div>
          <div className="gs-sub">{t('gs.sub')}</div>
        </div>
        <div className="gs-prog">{doneCount}/{steps.length}</div>
      </div>
      <div className="gs-bar"><span style={{ width: `${(doneCount / steps.length) * 100}%` }} /></div>
      {steps.map((s) => (
        <button key={s.key} className={`gs-row ${s.done ? 'done' : ''}`} disabled={s.done} onClick={s.onClick}>
          <span className={`gs-check ${s.done ? 'on' : ''}`}>{s.done ? '✓' : s.ic}</span>
          <span className="gs-text">
            <span className="gs-l">{s.label}</span>
            <span className="gs-d">{s.desc}</span>
          </span>
          <span className="gs-action">{s.done ? t('gs.ok') : t('gs.go')}</span>
        </button>
      ))}
    </div>
  );
}
