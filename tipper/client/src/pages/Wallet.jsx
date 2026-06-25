import { useState, useEffect, useCallback } from 'react';
import { Screen, AppBar, Spinner, Empty } from '../components/Layout.jsx';
import { Money } from '../components/fx.jsx';
import { feedback } from '../sound.js';
import { api, STANDALONE } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { coin, pts, timeAgo } from '../constants.js';

const TX = {
  credit: { label: 'Achat de Coins', ic: '＋', bg: 'rgba(54,224,160,0.14)', cls: 'pos' },
  debit: { label: 'Retrait', ic: '↗', bg: 'var(--surface-2)', cls: 'neg' },
  tip_in: { label: 'Pourboire reçu', ic: '💰', bg: 'rgba(54,224,160,0.14)', cls: 'pos' },
  tip_out: { label: 'Pourboire versé', ic: '🎁', bg: 'var(--surface-2)', cls: 'neg' },
  escrow_hold: { label: 'Bloqué en séquestre', ic: '🔒', bg: 'rgba(255,194,75,0.16)', cls: 'hold' },
  escrow_refund: { label: 'Séquestre remboursé', ic: '↩', bg: 'rgba(54,224,160,0.14)', cls: 'pos' },
  points_exchange: { label: 'Échange de Points', ic: '🎯', bg: 'rgba(139,92,255,0.16)', cls: 'pos' },
};

export function Wallet() {
  const { setUser, showToast } = useApp();
  const [data, setData] = useState(null);
  const [amount, setAmount] = useState('');
  const [exchangeQty, setExchangeQty] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => { try { setData(await api.wallet()); } catch (e) { showToast(e.message, 'error'); } }, [showToast]);
  useEffect(() => { load(); }, [load]);

  async function buy() {
    const a = Number(amount);
    if (!a || a <= 0) return showToast('Montant invalide', 'error');
    setBusy(true);
    try {
      // En prod avec Stripe configuré, on redirige vers le paiement ; sinon crédit direct.
      if (!STANDALONE) {
        try { const { url } = await api.checkout(a); if (url) { window.location.href = url; return; } } catch { /* fallback */ }
      }
      const r = await api.topup(a);
      if (r.user) setUser(r.user);
      setAmount(''); feedback('coin'); showToast(`+${coin(a)} 🎉`); load();
    } catch (e) { showToast(e.message, 'error'); } finally { setBusy(false); }
  }

  async function withdraw() {
    const a = Number(amount);
    if (!a || a <= 0) return showToast('Montant invalide', 'error');
    setBusy(true);
    try { const r = await api.withdraw(a); if (r.user) setUser(r.user); setAmount(''); showToast(`${coin(a)} retirés`); load(); }
    catch (e) { showToast(e.message, 'error'); } finally { setBusy(false); }
  }

  async function exchange() {
    const rate = data?.points_per_coin || 10;
    const max = Math.floor((data?.points || 0) / rate);
    const qty = exchangeQty ? Number(exchangeQty) : max;
    if (!qty || qty <= 0) return showToast('Pas assez de points', 'error');
    setBusy(true);
    try { const r = await api.exchangePoints(qty); if (r.user) setUser(r.user); setExchangeQty(''); feedback('coin'); showToast(`+${coin(qty)} via vos points 🎯`); load(); }
    catch (e) { showToast(e.message, 'error'); } finally { setBusy(false); }
  }

  const rate = data?.points_per_coin || 10;
  const convertible = data ? Math.floor((data.points || 0) / rate) : 0;

  return (
    <Screen>
      <AppBar title="Mon wallet" back="/profile" />
      <div className="content">
        <div className="balance">
          <div className="sheen" />
          <div className="lbl">Tipper Coins disponibles</div>
          <div className="amt"><Money value={data ? data.available : 0} format={coin} /></div>
          {data && data.reserved > 0 && <div className="escrow">🔒 {coin(data.reserved)} en séquestre</div>}
        </div>
        <div className="spacer" />

        {/* Tipper Points */}
        <div className="card" style={{ background: 'rgba(139,92,255,0.08)', borderColor: 'rgba(139,92,255,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="t-ic" style={{ background: 'rgba(139,92,255,0.2)', margin: 0 }}>🎯</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800 }}>{pts(data ? data.points : 0)} Tipper Points</div>
              <div className="sub" style={{ fontSize: 12.5 }}>{rate} points = 1 🪙 · gagnés en participant</div>
            </div>
          </div>
          {convertible > 0 ? (
            <div className="btn-row" style={{ marginTop: 12 }}>
              <input type="number" value={exchangeQty} onChange={(e) => setExchangeQty(e.target.value)} placeholder={`max ${convertible}`} style={{ flex: 1, border: '1px solid var(--glass-border-2)', borderRadius: 12, padding: 12, background: 'var(--surface-2)', color: 'var(--text)' }} />
              <button className="btn iris sm" style={{ whiteSpace: 'nowrap' }} disabled={busy} onClick={exchange}>Échanger en Coins</button>
            </div>
          ) : <div className="sub" style={{ fontSize: 12.5, marginTop: 10 }}>Participez à des missions pour gagner des points même sans remporter le pourboire 💪</div>}
        </div>

        <div className="card">
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Acheter des Tipper Coins <span className="muted">(1 CHF = 1 🪙)</span></label>
            <div className="input-prefix"><span>CHF</span>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100" />
            </div>
          </div>
          <div className="btn-row">
            <button className="btn teal" disabled={busy} onClick={buy}>{STANDALONE ? '＋ Créditer' : '💳 Payer'}</button>
            <button className="btn ghost" disabled={busy} onClick={withdraw}>↗ Retirer</button>
          </div>
          <div className="center sub" style={{ fontSize: 12, marginTop: 10 }}>{STANDALONE ? 'Paiement simulé pour la démo' : 'Paiement sécurisé via Stripe'}</div>
        </div>

        <div className="h-sec" style={{ marginTop: 6 }}>Historique</div>
        {!data ? <Spinner /> : data.transactions.length === 0 ? <Empty icon="🧾" title="Aucune transaction" /> : (
          <div className="card">
            {data.transactions.map((t) => {
              const m = TX[t.type] || { label: t.type, ic: '•', bg: 'var(--surface-2)', cls: 'neg' };
              return (
                <div key={t.id} className="tx">
                  <div className="ic" style={{ background: m.bg }}>{m.ic}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{m.label}</div>
                    <div className="sub" style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.description} · {timeAgo(t.created_at)}</div>
                  </div>
                  <div className={`amt ${m.cls}`}>{t.amount >= 0 ? '+' : ''}{coin(t.amount)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Screen>
  );
}
