import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { coin } from '../constants.js';

// ───────────────────────────────────────────────────────────────────────────
// Composants de compréhension : les deux actions principales de Tipper, et
// les explications « qui paie / que vaut un Coin / pourquoi ma position ».
// Réutilisés sur l'onboarding, l'accueil, le wallet et le détail d'une demande.
// ───────────────────────────────────────────────────────────────────────────

// Les deux façons d'utiliser Tipper. Un membre peut être tour à tour l'un
// et l'autre : on ne l'enferme jamais dans un rôle.
export function TwoChoices({ onNeed, onHelp, short = false, note = true }) {
  const { t } = useApp();
  const navigate = useNavigate();
  const need = onNeed || (() => navigate('/categories'));
  const help = onHelp || (() => navigate('/explore'));
  return (
    <>
      <div className="choices">
        <button className="choice need" onClick={need}>
          <span className="c-ic">🙋</span>
          <span className="c-txt">
            <span className="c-t">{t('ux.need.t')}</span>
            <span className="c-d">{t(short ? 'ux.need.short' : 'ux.need.d')}</span>
          </span>
          <span className="c-go">›</span>
        </button>
        <button className="choice help" onClick={help}>
          <span className="c-ic">🤝</span>
          <span className="c-txt">
            <span className="c-t">{t('ux.help.t')}</span>
            <span className="c-d">{t(short ? 'ux.help.short' : 'ux.help.d')}</span>
          </span>
          <span className="c-go">›</span>
        </button>
      </div>
      {note && <p className="choices-note">{t('ux.ob.both')}</p>}
    </>
  );
}

// Explique le trajet de l'argent : réservé → versé à la fin → remboursé sinon.
// `role` : 'poster' (celui qui demande) ou 'helper' (celui qui aide).
export function PayExplainer({ role = 'poster', amount = null, commission = 0.1 }) {
  const { t } = useApp();
  const net = amount != null ? Math.round(amount * (1 - commission) * 100) / 100 : null;
  return (
    <div className="explain">
      <div className="ex-head">🔒 {t('ux.pay.title')}</div>
      {role === 'poster' ? (
        <ol className="ex-list">
          <li>{t('ux.pay.s1')}</li>
          <li>{t('ux.pay.s2')}</li>
          <li>{t('ux.pay.s3')}</li>
        </ol>
      ) : (
        <>
          <p className="ex-p">{t('ux.pay.whoPays')}</p>
          {net != null && (
            <div className="ex-net">
              <span>{t('ux.pay.youGet')}</span>
              <b>{coin(net)}</b>
              <span className="ex-fee">{t('ux.pay.afterFee')}</span>
            </div>
          )}
        </>
      )}
      <p className="ex-fine">{t('ux.pay.commission')}</p>
    </div>
  );
}

// Explique la valeur d'un Coin. La question « est-ce de l'argent réel ? »
// ne doit jamais rester sans réponse.
export function CoinExplainer({ compact = false }) {
  const { t } = useApp();
  if (compact) return <span className="coin-rule">{t('ux.coin.rule')}</span>;
  return (
    <div className="explain coins">
      <div className="ex-head">🪙 {t('ux.coin.title')}</div>
      <div className="coin-eq">{t('ux.coin.rule')}</div>
      <p className="ex-p">{t('ux.coin.explain')}</p>
    </div>
  );
}

// Demande la position en expliquant d'abord à quoi elle sert et ce qui reste
// privé. On ne déclenche jamais la permission navigateur sans ce contexte.
export function GeoPrompt({ onAllow, onLater, busy = false }) {
  const { t } = useApp();
  return (
    <div className="explain geo">
      <div className="ex-head">📍 {t('ux.geo.t')}</div>
      <p className="ex-p">{t('ux.geo.d')}</p>
      <p className="ex-fine">🔒 {t('ux.geo.priv')}</p>
      <div className="btn-row" style={{ marginTop: 12 }}>
        <button className="btn coral sm" style={{ flex: 1 }} disabled={busy} onClick={onAllow}>{t('ux.geo.cta')}</button>
        {onLater && <button className="btn ghost sm" onClick={onLater}>{t('ux.geo.later')}</button>}
      </div>
    </div>
  );
}

// Frise du parcours d'une demande — « où j'en suis » en un coup d'œil.
const JOURNEY = ['ux.tr.1', 'ux.tr.2', 'ux.tr.3', 'ux.tr.4', 'ux.tr.5', 'ux.tr.6'];

// Traduit l'état technique d'une demande en position sur la frise.
export function journeyStep(ad) {
  if (!ad) return 0;
  if (ad.status === 'completed') return 5;
  if (ad.status === 'delivered') return 4;
  if (ad.status === 'in_progress') return 3;
  if ((ad.applicants_count || 0) > 0) return 1;
  return 0;
}

export function Journey({ step = 0 }) {
  const { t } = useApp();
  return (
    <ol className="journey">
      {JOURNEY.map((k, i) => (
        <li key={k} className={i < step ? 'done' : i === step ? 'now' : ''}>
          <span className="j-dot">{i < step ? '✓' : i + 1}</span>
          <span className="j-l">{t(k)}</span>
        </li>
      ))}
    </ol>
  );
}
