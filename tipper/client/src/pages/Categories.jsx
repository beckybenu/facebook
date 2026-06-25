import { useNavigate } from 'react-router-dom';
import { Screen, AppBar } from '../components/Layout.jsx';
import { CATEGORIES } from '../constants.js';

export function Categories() {
  const navigate = useNavigate();
  return (
    <Screen>
      <AppBar title="Publier une mission" back="/" />
      <div className="content">
        <div className="eyebrow">Étape 1 / 2</div>
        <h1 className="h-page" style={{ margin: '6px 0 6px' }}>Quelle catégorie ?</h1>
        <p className="sub" style={{ marginBottom: 18 }}>Choisissez le type de service que vous recherchez.</p>
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
