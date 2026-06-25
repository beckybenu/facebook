import { useState, useEffect, useCallback } from 'react';
import { Screen, AppBar, Spinner, Empty } from '../components/Layout.jsx';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { chf, timeAgo } from '../constants.js';

const TX = {
  credit: { label: 'Rechargement', ic: '＋', bg: '#e4f7f3', cls: 'pos' },
  debit: { label: 'Retrait', ic: '↗', bg: 'var(--line-soft)', cls: 'neg' },
  tip_in: { label: 'Pourboire reçu', ic: '💰', bg: '#e4f7f3', cls: 'pos' },
  tip_out: { label: 'Pourboire versé', ic: '🎁', bg: 'var(--line-soft)', cls: 'neg' },
  escrow_hold: { label: 'Bloqué en séquestre', ic: '🔒', bg: '#fff1d9', cls: 'hold' },
  escrow_refund: { label: 'Séquestre remboursé', ic: '↩', bg: '#e4f7f3', cls: 'pos' },
};

export function Wallet() {
  const { setUser, showToast } = useApp();
  const [data, setData] = useState(null);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => { try { setData(await api.wallet()); } catch (e) { showToast(e.message, 'error'); } }, [showToast]);
  useEffect(() => { load(); }, [load]);

  async function act(kind) {
    const a = Number(amount);
    if (!a || a <= 0) return showToast('Montant invalide', 'error');
    setBusy(true);
    try {
      const r = kind === 'topup' ? await api.topup(a) : await api.withdraw(a);
      if (r.user) setUser(r.user);
      setAmount(''); showToast(kind === 'topup' ? `+${chf(a)} 💳` : `${chf(a)} retirés`); load();
    } catch (e) { showToast(e.message, 'error'); } finally { setBusy(false); }
  }

  return (
    <Screen>
      <AppBar title="Mon wallet" back="/profile" />
      <div className="content">
        <div className="balance">
          <div className="lbl">Solde disponible</div>
          <div className="amt">{chf(data ? data.available : 0)}</div>
          {data && data.reserved > 0 && <div className="escrow">🔒 {chf(data.reserved)} en séquestre · total {chf(data.total)}</div>}
        </div>
        <div className="spacer" />

        <div className="card">
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Montant</label>
            <div className="input-prefix"><span>CHF</span>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100" />
            </div>
          </div>
          <div className="btn-row">
            <button className="btn teal" disabled={busy} onClick={() => act('topup')}>＋ Recharger</button>
            <button className="btn ghost" disabled={busy} onClick={() => act('withdraw')}>↗ Retirer</button>
          </div>
          <div className="center sub" style={{ fontSize: 12, marginTop: 10 }}>Paiement simulé pour la démo</div>
        </div>

        <div className="h-sec" style={{ marginTop: 6 }}>Historique</div>
        {!data ? <Spinner /> : data.transactions.length === 0 ? <Empty icon="🧾" title="Aucune transaction" /> : (
          <div className="card">
            {data.transactions.map((t) => {
              const m = TX[t.type] || { label: t.type, ic: '•', bg: 'var(--line-soft)', cls: 'neg' };
              return (
                <div key={t.id} className="tx">
                  <div className="ic" style={{ background: m.bg }}>{m.ic}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{m.label}</div>
                    <div className="sub" style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.description} · {timeAgo(t.created_at)}</div>
                  </div>
                  <div className={`amt ${m.cls}`}>{t.amount >= 0 ? '+' : ''}{chf(t.amount)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Screen>
  );
}
