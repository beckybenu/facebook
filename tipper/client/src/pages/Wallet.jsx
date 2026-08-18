import { useState, useEffect, useCallback } from 'react';
import { Screen, AppBar, Spinner, Empty } from '../components/Layout.jsx';
import { CoinExplainer } from '../components/Explain.jsx';
import { Money } from '../components/fx.jsx';
import { feedback } from '../sound.js';
import { api, STANDALONE } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { coin, pts, timeAgo } from '../constants.js';

// Libellés d'opérations — dits en langage humain, pas en jargon comptable.
const TX = {
  credit: { k: 'tx.credit', ic: '＋', bg: 'rgba(54,224,160,0.14)', cls: 'pos' },
  debit: { k: 'tx.debit', ic: '↗', bg: 'var(--surface-2)', cls: 'neg' },
  tip_in: { k: 'tx.tip_in', ic: '💰', bg: 'rgba(54,224,160,0.14)', cls: 'pos' },
  tip_out: { k: 'tx.tip_out', ic: '🎁', bg: 'var(--surface-2)', cls: 'neg' },
  escrow_hold: { k: 'tx.escrow_hold', ic: '🔒', bg: 'rgba(255,194,75,0.16)', cls: 'hold' },
  escrow_refund: { k: 'tx.escrow_refund', ic: '↩', bg: 'rgba(54,224,160,0.14)', cls: 'pos' },
  points_exchange: { k: 'tx.points_exchange', ic: '🎯', bg: 'rgba(139,92,255,0.16)', cls: 'pos' },
  boost: { k: 'tx.boost', ic: '🚀', bg: 'var(--surface-2)', cls: 'neg' },
  subscription: { k: 'tx.subscription', ic: '💎', bg: 'var(--surface-2)', cls: 'neg' },
};

// Mon argent — répond dans l'ordre à : combien j'ai, ce que ça vaut,
// ce qui est bloqué et pourquoi, comment en ajouter ou en retirer.
export function Wallet() {
  const { user, setUser, showToast, t } = useApp();
  const [data, setData] = useState(null);
  const [amount, setAmount] = useState('');
  const [exchangeQty, setExchangeQty] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => { try { setData(await api.wallet()); } catch (e) { showToast(e.message, 'error'); } }, [showToast]);
  useEffect(() => { load(); }, [load]);

  async function goPro() {
    if (!window.confirm(`${t('ux.pro.title')} — 49 🪙/${'mois'} ?`)) return;
    setBusy(true);
    try { const r = await api.subscribePro(); if (r.user) setUser(r.user); feedback('coin'); showToast('💎 Tipper Pro'); }
    catch (e) { showToast(e.message, 'error'); } finally { setBusy(false); }
  }

  async function buy() {
    const a = Number(amount);
    if (!a || a <= 0) return showToast(t('ux.amountInvalid'), 'error');
    setBusy(true);
    try {
      // En prod avec Stripe configuré on redirige vers le paiement ; sinon crédit direct.
      if (!STANDALONE) {
        try { const { url } = await api.checkout(a); if (url) { window.location.href = url; return; } } catch { /* repli */ }
      }
      const r = await api.topup(a);
      if (r.user) setUser(r.user);
      setAmount(''); feedback('coin'); showToast(`+${coin(a)} 🎉`); load();
    } catch (e) { showToast(e.message, 'error'); } finally { setBusy(false); }
  }

  async function withdraw() {
    const a = Number(amount);
    if (!a || a <= 0) return showToast(t('ux.amountInvalid'), 'error');
    setBusy(true);
    try { const r = await api.withdraw(a); if (r.user) setUser(r.user); setAmount(''); showToast(`${coin(a)} → 🏦`); load(); }
    catch (e) { showToast(e.message, 'error'); } finally { setBusy(false); }
  }

  async function exchange() {
    const rate = data?.points_per_coin || 10;
    const max = Math.floor((data?.points || 0) / rate);
    const qty = exchangeQty ? Number(exchangeQty) : max;
    if (!qty || qty <= 0) return showToast(t('ux.amountInvalid'), 'error');
    setBusy(true);
    try { const r = await api.exchangePoints(qty); if (r.user) setUser(r.user); setExchangeQty(''); feedback('coin'); showToast(`+${coin(qty)} 🎯`); load(); }
    catch (e) { showToast(e.message, 'error'); } finally { setBusy(false); }
  }

  const rate = data?.points_per_coin || 10;
  const convertible = data ? Math.floor((data.points || 0) / rate) : 0;

  return (
    <Screen>
      <AppBar title={t('ux.wallet.title')} back="/profile" />
      <div className="content">
        {/* Solde — la valeur d'un Coin est affichée à côté du montant, jamais cachée */}
        <div className="balance">
          <div className="sheen" />
          <div className="lbl" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {t('ux.available')} <CoinExplainer compact />
          </div>
          <div className="amt"><Money value={data ? data.available : 0} format={coin} /></div>
          {data && data.reserved > 0 && (
            <div className="escrow">🔒 {coin(data.reserved)} · {t('ux.reserved').toLowerCase()}</div>
          )}
        </div>
        <div className="spacer" />

        {/* Ce que valent les Coins — la question ne doit jamais rester ouverte */}
        <CoinExplainer />

        {/* Ce qui est réservé et pourquoi */}
        {data && data.reserved > 0 && (
          <div className="explain">
            <div className="ex-head">🔒 {t('ux.reserved')} · {coin(data.reserved)}</div>
            <p className="ex-p" style={{ margin: 0 }}>{t('ux.reserved.d')}</p>
          </div>
        )}

        {/* Ajouter / reverser */}
        <div className="card">
          <div className="field" style={{ marginBottom: 6 }}>
            <label>{t('ux.coin.buy')}</label>
            <div className="input-prefix"><span>CHF</span>
              <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100" />
            </div>
            <div className="hint">{t('ux.coin.buyHint')}</div>
          </div>
          <div className="btn-row" style={{ marginTop: 12 }}>
            <button className="btn teal" style={{ flex: 1 }} disabled={busy} onClick={buy}>{t('ux.coin.buy')}</button>
            <button className="btn ghost" style={{ flex: 1 }} disabled={busy} onClick={withdraw}>{t('ux.coin.withdraw')}</button>
          </div>
          <div className="hint" style={{ marginTop: 10 }}>{t('ux.coin.withdrawHint')}</div>
          <div className="center sub" style={{ fontSize: 12, marginTop: 6 }}>
            {STANDALONE ? 'Paiement simulé pour la démo' : '🔒 Stripe'}
          </div>
        </div>

        {/* Tipper Points */}
        <div className="card" style={{ background: 'rgba(139,92,255,0.08)', borderColor: 'rgba(139,92,255,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="t-ic" style={{ background: 'rgba(139,92,255,0.2)', margin: 0 }}>🎯</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800 }}>{pts(data ? data.points : 0)}</div>
              <div className="sub" style={{ fontSize: 12.5 }}>{rate} {t('ux.points.rate')}</div>
            </div>
          </div>
          <p className="sub" style={{ fontSize: 12.5, margin: '10px 0 0' }}>{t('ux.points.d')}</p>
          {convertible > 0 ? (
            <div className="btn-row" style={{ marginTop: 12 }}>
              <input type="number" inputMode="numeric" value={exchangeQty} onChange={(e) => setExchangeQty(e.target.value)} placeholder={`max ${convertible}`} style={{ flex: 1, minWidth: 0, border: '1px solid var(--glass-border-2)', borderRadius: 12, padding: 12, background: 'var(--surface-2)', color: 'var(--text)' }} />
              <button className="btn iris sm" style={{ whiteSpace: 'nowrap' }} disabled={busy} onClick={exchange}>{t('ux.points.exchange')}</button>
            </div>
          ) : <div className="sub" style={{ fontSize: 12.5, marginTop: 8 }}>{t('ux.points.empty')}</div>}
        </div>

        {/* Tipper Pro — fonctionnalité avancée, donc placée après l'essentiel */}
        <div className="pro-card">
          <div className="pro-t">💎 {t('ux.pro.title')} {user.pro && <span className="pro-badge">{t('ux.pro.active')}</span>}</div>
          <p style={{ fontSize: 13.5, lineHeight: 1.55, margin: '8px 0 12px', opacity: 0.92 }}>{t('ux.pro.d')}</p>
          {user.pro
            ? <div className="sub" style={{ color: '#cdbcff' }}>{t('ux.pro.until')} {new Date(user.pro_until).toLocaleDateString()}</div>
            : <button className="btn" style={{ background: '#fff', color: '#3a2a8c' }} disabled={busy} onClick={goPro}>Tipper Pro · 49 🪙</button>}
        </div>

        <div className="h-sec" style={{ marginTop: 14 }}>{t('ux.history')}</div>
        {!data ? <Spinner /> : data.transactions.length === 0 ? <Empty icon="🧾" title={t('ux.none')} /> : (
          <div className="card">
            {data.transactions.map((tx) => {
              const m = TX[tx.type] || { k: null, ic: '•', bg: 'var(--surface-2)', cls: 'neg' };
              return (
                <div key={tx.id} className="tx">
                  <div className="ic" style={{ background: m.bg }}>{m.ic}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{m.k ? t(m.k) : tx.type}</div>
                    <div className="sub" style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.description} · {timeAgo(tx.created_at)}</div>
                  </div>
                  <div className={`amt ${m.cls}`}>{tx.amount >= 0 ? '+' : ''}{coin(tx.amount)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Screen>
  );
}
