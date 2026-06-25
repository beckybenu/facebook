import { useState, useEffect, useCallback } from 'react';
import { Screen, Header, Spinner, Empty } from '../components/Layout.jsx';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { chf, timeAgo } from '../constants.js';

const TX_LABEL = { credit: 'Rechargement', debit: 'Retrait', tip_in: 'Pourboire reçu', tip_out: 'Pourboire versé' };

export function Wallet() {
  const { user, setUser, showToast } = useApp();
  const [data, setData] = useState(null);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setData(await api.wallet()); } catch (e) { showToast(e.message, 'error'); }
  }, [showToast]);
  useEffect(() => { load(); }, [load]);

  async function topup() {
    const a = Number(amount);
    if (!a || a <= 0) return showToast('Montant invalide', 'error');
    setBusy(true);
    try {
      const { user: u } = await api.topup(a);
      setUser(u); setAmount(''); showToast(`+${chf(a)} ajoutés 💳`); load();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setBusy(false); }
  }

  async function withdraw() {
    const a = Number(amount);
    if (!a || a <= 0) return showToast('Montant invalide', 'error');
    setBusy(true);
    try {
      const { user: u } = await api.withdraw(a);
      setUser(u); setAmount(''); showToast(`${chf(a)} retirés`); load();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setBusy(false); }
  }

  return (
    <Screen>
      <Header title="TIPPER" back="/" />
      <div className="content">
        <h1 className="page-title">Mon Wallet</h1>
        <div className="wallet-hero">
          <div className="label">Solde disponible</div>
          <div className="amount">{chf(user.wallet_balance)}</div>
          <div className="label">{user.full_name}</div>
        </div>

        <div className="card">
          <div className="field" style={{ marginBottom: 10 }}>
            <label>Montant (CHF)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100" />
          </div>
          <div className="btn-row">
            <button className="btn ok" disabled={busy} onClick={topup}>＋ Recharger</button>
            <button className="btn ghost" disabled={busy} onClick={withdraw}>Retirer</button>
          </div>
          <div className="hint muted" style={{ fontSize: 12, marginTop: 8, textAlign: 'center' }}>Paiement simulé pour la démo</div>
        </div>

        <h2 style={{ fontSize: 18, margin: '16px 0 4px' }}>Historique</h2>
        {!data ? <Spinner /> : data.transactions.length === 0 ? (
          <Empty icon="🧾" title="Aucune transaction" />
        ) : (
          <div className="card">
            {data.transactions.map((t) => (
              <div key={t.id} className="tx-row">
                <div>
                  <div style={{ fontWeight: 600 }}>{TX_LABEL[t.type] || t.type}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{t.description} · {timeAgo(t.created_at)}</div>
                </div>
                <div className={`tx-amt ${t.amount >= 0 ? 'pos' : 'neg'}`}>{t.amount >= 0 ? '+' : ''}{chf(t.amount)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Screen>
  );
}
