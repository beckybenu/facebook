import { useNavigate } from 'react-router-dom';
import { Screen, AppBar } from '../components/Layout.jsx';
import { CATEGORIES, catGradient } from '../constants.js';

function CatCard({ c, onClick }) {
  return (
    <div className="cat-card" style={{ background: catGradient(c.key) }} onClick={onClick}>
      <div className="cc-grad" />
      <span className="cc-ic">{c.icon}</span>
      <span className="cc-t">{c.label}</span>
    </div>
  );
}

export function Categories() {
  const navigate = useNavigate();
  return (
    <Screen>
      <AppBar title="Publier une demande" back="/" />
      <div className="content">
        <div className="eyebrow">Étape 1 / 2</div>
        <h1 className="h-page" style={{ margin: '6px 0 6px' }}>Quelle catégorie ?</h1>
        <p className="sub" style={{ marginBottom: 18 }}>Choisissez le type de service que vous recherchez.</p>
        <div className="qa-grid">
          {CATEGORIES.map((c) => (
            <CatCard key={c.key} c={c} onClick={() => navigate(`/post/${c.key}`)} />
          ))}
        </div>
      </div>
    </Screen>
  );
}
