import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, AppBar } from '../components/Layout.jsx';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../api.js';
import { coin, catLabel, catIcon } from '../constants.js';
import { draftMission, KIND_META } from '../ai.js';

const EXAMPLES = [
  'Un Coca bien frais au lac 🏖️',
  'Vendre ma voiture rapidement 🚗',
  'Monter mon armoire IKEA 🔧',
  'Un studio à louer à Genève 🏠',
  'Des cigarettes ce soir 🚬',
];

export function Now() {
  const navigate = useNavigate();
  const { user, setUser, showToast, captureLocation } = useApp();
  const [text, setText] = useState('');
  const [draft, setDraft] = useState(null);
  const [tip, setTip] = useState('');
  const [busy, setBusy] = useState(false);

  function analyse(value) {
    const v = value ?? text;
    if (!v.trim()) return showToast('Décrivez votre besoin', 'error');
    const d = draftMission(v);
    setDraft(d); setTip(String(d.tip));
  }

  async function launch() {
    if (!draft) return;
    const t = Number(tip) || draft.tip;
    if (t > user.available) return showToast('Solde insuffisant. Rechargez vos Tipper Coins.', 'error');
    setBusy(true);
    try {
      let lat, lng;
      if (draft.kind === 'instant') {
        try {
          const u = await Promise.race([captureLocation(), new Promise((_, rej) => setTimeout(rej, 3000))]);
          if (u) { lat = u.lat; lng = u.lng; setUser(u); }
        } catch { /* on continue sans bloquer */ }
      }
      const form = new FormData();
      form.append('category', draft.category);
      form.append('title', draft.title);
      form.append('kind', draft.kind);
      form.append('tip_amount', t);
      form.append('description', draft.description);
      if (draft.urgent) form.append('urgent', '1');
      if (draft.value) form.append('price', draft.value);
      if (lat != null) { form.append('lat', lat); form.append('lng', lng); }
      const { ad } = await api.createAd(form);
      const { user: u } = await api.me(); setUser(u);
      if (draft.kind === 'instant') navigate(`/track/${ad.id}`);
      else navigate('/posted');
    } catch (e) { showToast(e.message, 'error'); } finally { setBusy(false); }
  }

  return (
    <Screen nav={false}>
      <AppBar title="" back="/" right={<span className="wordmark" style={{ fontSize: 18 }}>Tipper<span className="dot">.</span></span>} />
      <div className="content">
        <div className="eyebrow">✦ Propulsé par Tipper AI</div>
        <h1 className="h-hero" style={{ margin: '8px 0 4px' }}>De quoi avez-vous<br />besoin&nbsp;?</h1>
        <p className="sub" style={{ marginBottom: 16 }}>Écrivez-le simplement. L'IA crée la mission, fixe le pourboire juste et trouve un helper.</p>

        <div className="ai-box" style={{ marginBottom: 12 }}>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex : j'ai plus de Coca, je suis posé au lac…" />
          <span className="ai-spark">✦</span>
        </div>

        <div className="pill-row" style={{ marginBottom: 14 }}>
          {EXAMPLES.map((e) => (
            <button key={e} className="ai-chip" onClick={() => { setText(e); analyse(e); }}>{e}</button>
          ))}
        </div>

        <button className="btn iris" onClick={() => analyse()}>✦ Générer ma mission</button>

        {draft && (
          <div className="ai-draft fade-in" style={{ marginTop: 18 }}>
            <div className="badge-row">
              <span className={`kind-badge ${draft.kind}`}>{KIND_META[draft.kind].emoji} {KIND_META[draft.kind].label}</span>
              <span className="tag cat">{catIcon(draft.category)} {catLabel(draft.category)}</span>
              {draft.urgent && <span className="tag urgent">⚡ Urgent</span>}
            </div>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{draft.title}</div>
            <p className="sub" style={{ marginBottom: 14 }}>{draft.description}</p>
            <div className="field" style={{ marginBottom: 12 }}>
              <label>{draft.kind === 'quest' ? 'Prime offerte 🎯' : 'Pourboire offert 🪙'}</label>
              <div className="input-prefix"><span>🪙</span>
                <input type="number" value={tip} onChange={(e) => setTip(e.target.value)} />
              </div>
              <div className="hint">Bloqué en séquestre, libéré à la réussite · solde {coin(user.available)}</div>
            </div>
            <button className="btn coral" disabled={busy} onClick={launch}>
              {busy ? '…' : draft.kind === 'instant' ? '⚡ Lancer maintenant' : '🎯 Publier la quête'}
            </button>
          </div>
        )}
      </div>
    </Screen>
  );
}
