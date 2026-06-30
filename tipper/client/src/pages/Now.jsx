import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, AppBar } from '../components/Layout.jsx';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../api.js';
import { coin, catLabel, catIcon } from '../constants.js';
import { draftMission, KIND_META, voiceLocale } from '../ai.js';

export function Now() {
  const navigate = useNavigate();
  const { user, setUser, showToast, captureLocation, t, lang } = useApp();
  const [text, setText] = useState('');
  const [draft, setDraft] = useState(null);
  const [tip, setTip] = useState('');
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);

  const EXAMPLES = [t('now.ex1'), t('now.ex2'), t('now.ex3'), t('now.ex4'), t('now.ex5')];

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return showToast(t('now.dictNo'), 'error');
    const rec = new SR();
    rec.lang = voiceLocale(lang); rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.onresult = (e) => { const tr = e.results[0][0].transcript; setText(tr); analyse(tr); };
    rec.start();
  }

  function analyse(value) {
    const v = value ?? text;
    if (!v.trim()) return showToast(t('now.needDesc'), 'error');
    const d = draftMission(v);
    setDraft(d); setTip(String(d.tip)); setPrice(d.value ? String(d.value) : '');
  }

  async function launch() {
    if (!draft) return;
    const tipNum = Number(tip) || draft.tip;
    if (tipNum > user.available) return showToast(t('now.insufficient'), 'error');
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
      form.append('tip_amount', tipNum);
      form.append('description', draft.description);
      if (draft.urgent) form.append('urgent', '1');
      if (draft.kind === 'quest' && price) form.append('price', price); // prix de vente fixé par le demandeur
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
        <div className="eyebrow">{t('now.eyebrow')}</div>
        <h1 className="h-hero" style={{ margin: '8px 0 4px' }}>{t('now.title')}</h1>
        <p className="sub" style={{ marginBottom: 16 }}>{t('now.desc')}</p>

        <div className="ai-box" style={{ marginBottom: 12 }}>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t('now.placeholder')} />
          <button className={`mic-btn ${listening ? 'on' : ''}`} onClick={startVoice} title={t('now.dictate')} type="button">🎙️</button>
        </div>

        <div className="pill-row" style={{ marginBottom: 14 }}>
          {EXAMPLES.map((e) => (
            <button key={e} className="ai-chip" onClick={() => { setText(e); analyse(e); }}>{e}</button>
          ))}
        </div>

        <button className="btn iris" onClick={() => analyse()}>{t('now.generate')}</button>

        {draft && (
          <div className="ai-draft fade-in" style={{ marginTop: 18 }}>
            <div className="badge-row">
              <span className={`kind-badge ${draft.kind}`}>{KIND_META[draft.kind].emoji} {KIND_META[draft.kind].label}</span>
              <span className="tag cat">{catIcon(draft.category)} {catLabel(draft.category)}</span>
              {draft.urgent && <span className="tag urgent">{t('ad.urgent')}</span>}
            </div>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{draft.title}</div>
            <p className="sub" style={{ marginBottom: 14 }}>{draft.description}</p>
            {draft.kind === 'quest' && (
              <div className="field" style={{ marginBottom: 12 }}>
                <label>{t('now.priceLabel')}</label>
                <div className="input-prefix"><span>🪙</span>
                  <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
                </div>
                <div className="hint">{t('now.priceHint')}</div>
              </div>
            )}
            <div className="field" style={{ marginBottom: 12 }}>
              <label>{draft.kind === 'quest' ? t('now.primeLabel') : t('now.tipLabel')}</label>
              <div className="input-prefix"><span>🪙</span>
                <input type="number" value={tip} onChange={(e) => setTip(e.target.value)} />
              </div>
              <div className="hint">{t('now.escrowHint')} {coin(user.available)}</div>
            </div>
            <button className="btn coral" disabled={busy} onClick={launch}>
              {busy ? '…' : draft.kind === 'instant' ? t('now.launchInstant') : t('now.publishQuest')}
            </button>
          </div>
        )}
      </div>
    </Screen>
  );
}
