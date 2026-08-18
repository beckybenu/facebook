import { useNavigate } from 'react-router-dom';
import { Screen, AppBar } from '../components/Layout.jsx';
import { useApp } from '../context/AppContext.jsx';
import { CATEGORIES } from '../constants.js';

export function Categories() {
  const navigate = useNavigate();
  const { t } = useApp();
  return (
    <Screen>
      <AppBar title={t('ux.cat.title')} back="/" />
      <div className="content">
        <div className="eyebrow">{t('ux.cat.step')}</div>
        <h1 className="h-page" style={{ margin: '6px 0 6px' }}>{t('ux.cat.q')}</h1>
        <p className="sub" style={{ marginBottom: 18 }}>{t('ux.cat.d')}</p>
        <div className="qa-grid">
          {CATEGORIES.map((c) => (
            <div key={c.key} className="qa" onClick={() => navigate(`/post/${c.key}`)}>
              <div className="qa-ic" style={{ background: c.tint + '22', color: c.tint }}>{c.icon}</div>
              <div className="qa-t">{c.label}</div>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}
