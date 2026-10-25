import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, AppBar, Spinner } from '../components/Layout.jsx';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../api.js';
import { feedback } from '../sound.js';

const DOCS = [
  { key: 'passport', label: 'Passeport', icon: '🛂' },
  { key: 'id_card', label: "Carte d'identité", icon: '🪪' },
  { key: 'driver', label: 'Permis de conduire', icon: '🚗' },
];

// Capture caméra avec repli (upload) si indisponible
function Capture({ facing = 'environment', oval = false, prompt, onCapture, cta }) {
  const videoRef = useRef();
  const fileRef = useRef();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const streamRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('no camera');
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: false });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play().catch(() => {}); }
        setReady(true);
      } catch { setFailed(true); }
    })();
    return () => { cancelled = true; if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop()); };
  }, [facing]);

  function snap() {
    const v = videoRef.current;
    const size = 360;
    const c = document.createElement('canvas');
    const ratio = (v.videoHeight && v.videoWidth) ? v.videoHeight / v.videoWidth : 0.7;
    c.width = size; c.height = Math.round(size * ratio);
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    feedback('tap');
    onCapture(c.toDataURL('image/jpeg', 0.55));
  }

  function onFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => onCapture(r.result);
    r.readAsDataURL(f);
  }

  if (failed) {
    return (
      <div className="card center">
        <div style={{ fontSize: 38 }}>📷</div>
        <p className="sub" style={{ margin: '8px 0 14px' }}>Caméra indisponible — importez {oval ? 'un selfie' : 'une photo du document'}.</p>
        <button className="btn coral" onClick={() => fileRef.current.click()}>📁 Importer une image</button>
        <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => onCapture('simulated')}>Simuler la capture (démo)</button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
      </div>
    );
  }

  return (
    <div className="center">
      <div className={`cam-frame ${oval ? 'oval' : ''}`}>
        <video ref={videoRef} playsInline muted />
        <div className={`cam-guide ${oval ? 'oval' : ''}`} />
      </div>
      <p className="sub" style={{ margin: '12px 0' }}>{prompt}</p>
      <button className="btn coral" disabled={!ready} onClick={snap}>{cta}</button>
    </div>
  );
}

export function Verify() {
  const navigate = useNavigate();
  const { user, setUser, showToast } = useApp();
  const [step, setStep] = useState(user.kyc_status === 'pending' ? 'pending' : 'intro');
  const [docType, setDocType] = useState(null);
  const [docImg, setDocImg] = useState(null);
  const [selfie, setSelfie] = useState(null);

  // Auto-approbation simulée quand on est en "pending"
  useEffect(() => {
    if (step !== 'pending') return;
    const t = setTimeout(async () => {
      try { const { user: u } = await api.finalizeKyc(); setUser(u); feedback('success'); setStep('done'); }
      catch (e) { showToast(e.message, 'error'); setStep('intro'); }
    }, 3500);
    return () => clearTimeout(t);
  }, [step, setUser, showToast]);

  async function submit() {
    try { await api.submitKyc({ doc_type: docType, selfie }); setStep('pending'); }
    catch (e) { showToast(e.message, 'error'); }
  }

  if (user.kyc_status === 'verified' && step !== 'done') {
    return (
      <Screen nav={false}>
        <AppBar title="Vérification" back="/profile" />
        <div className="content center" style={{ paddingTop: 60 }}>
          <div style={{ fontSize: 64 }}>✅</div>
          <h1 className="h-page" style={{ margin: '12px 0' }}>Identité vérifiée</h1>
          <p className="sub">Votre compte Tipper est entièrement vérifié.</p>
          <div className="spacer" /><button className="btn coral" onClick={() => navigate('/profile')}>Retour au profil</button>
        </div>
      </Screen>
    );
  }

  return (
    <Screen nav={false}>
      <AppBar title="Vérification d'identité" back="/profile" />
      <div className="content">
        {step === 'intro' && (
          <>
            <div className="eyebrow">🔒 Sécurité · KYC</div>
            <h1 className="h-hero" style={{ margin: '8px 0 4px' }}>Vérifiez votre identité</h1>
            <p className="sub" style={{ marginBottom: 16 }}>Comme votre banque, nous vérifions votre identité pour sécuriser les paiements et autoriser les retraits. ~2 minutes.</p>
            <div className="card"><div className="kyc-step"><span>1️⃣</span><div><b>Pièce d'identité</b><div className="sub" style={{ fontSize: 12.5 }}>Passeport, CI ou permis</div></div></div></div>
            <div className="card"><div className="kyc-step"><span>2️⃣</span><div><b>Selfie vidéo</b><div className="sub" style={{ fontSize: 12.5 }}>Preuve de vie (liveness)</div></div></div></div>
            <div className="card"><div className="kyc-step"><span>3️⃣</span><div><b>Vérification</b><div className="sub" style={{ fontSize: 12.5 }}>Réponse en quelques instants</div></div></div></div>
            <button className="btn coral" onClick={() => setStep('doctype')}>Commencer</button>
          </>
        )}

        {step === 'doctype' && (
          <>
            <h1 className="h-page" style={{ marginBottom: 14 }}>Choisissez votre document</h1>
            {DOCS.map((d) => (
              <button key={d.key} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left' }}
                onClick={() => { setDocType(d.key); setStep('doc'); }}>
                <span style={{ fontSize: 26 }}>{d.icon}</span>
                <span style={{ fontWeight: 700 }}>{d.label}</span>
                <span style={{ marginLeft: 'auto' }}>→</span>
              </button>
            ))}
          </>
        )}

        {step === 'doc' && (
          <>
            <h1 className="h-page" style={{ marginBottom: 6 }}>Photographiez votre document</h1>
            <p className="sub" style={{ marginBottom: 14 }}>Placez-le bien à plat, lisible, dans le cadre.</p>
            <Capture facing="environment" prompt="Document entièrement visible dans le cadre" cta="📸 Capturer"
              onCapture={(img) => { setDocImg(img); setStep('selfie'); }} />
          </>
        )}

        {step === 'selfie' && (
          <>
            <h1 className="h-page" style={{ marginBottom: 6 }}>Selfie vidéo</h1>
            <p className="sub" style={{ marginBottom: 14 }}>Regardez l'objectif et tournez lentement la tête (preuve de vie).</p>
            <Capture facing="user" oval prompt="Centrez votre visage dans l'ovale" cta="🤳 Prendre le selfie"
              onCapture={(img) => { setSelfie(img); setStep('submit'); }} />
          </>
        )}

        {step === 'submit' && (
          <>
            <h1 className="h-page" style={{ marginBottom: 14 }}>Vérifiez et envoyez</h1>
            <div className="card" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              {selfie && selfie !== 'simulated'
                ? <img src={selfie} alt="" style={{ width: 72, height: 72, borderRadius: 18, objectFit: 'cover' }} />
                : <div className="av l">🙂</div>}
              <div>
                <div style={{ fontWeight: 800 }}>{user.full_name}</div>
                <div className="sub" style={{ fontSize: 13 }}>Document : {DOCS.find((d) => d.key === docType)?.label}</div>
                <div className="sub" style={{ fontSize: 13 }}>✓ Pièce d'identité · ✓ Selfie</div>
              </div>
            </div>
            <p className="sub" style={{ fontSize: 12.5, margin: '4px 0 14px' }}>En continuant, vous acceptez le traitement de vos données d'identité pour la vérification (RGPD).</p>
            <button className="btn coral" onClick={submit}>Envoyer pour vérification</button>
            <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => setStep('doctype')}>Recommencer</button>
          </>
        )}

        {step === 'pending' && (
          <div className="center" style={{ paddingTop: 50 }}>
            <Spinner />
            <h1 className="h-page" style={{ marginTop: 10 }}>Vérification en cours…</h1>
            <p className="sub">Analyse de votre document et de votre selfie 🔍</p>
          </div>
        )}

        {step === 'done' && (
          <div className="center" style={{ paddingTop: 50 }}>
            <div style={{ fontSize: 72 }}>✅</div>
            <h1 className="h-hero" style={{ margin: '12px 0' }}>Vous êtes vérifié !</h1>
            <p className="sub">Badge Vérifié activé · retraits débloqués · +30 XP</p>
            <div className="spacer" />
            <button className="btn coral" onClick={() => navigate('/wallet')}>Aller au wallet</button>
            <div className="spacer" />
            <button className="btn ghost" onClick={() => navigate('/profile')}>Retour au profil</button>
          </div>
        )}
      </div>
    </Screen>
  );
}
