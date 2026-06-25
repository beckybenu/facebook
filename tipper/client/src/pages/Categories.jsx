import { useNavigate } from 'react-router-dom';
import { Screen, Header } from '../components/Layout.jsx';
import { CATEGORIES } from '../constants.js';

export function Categories() {
  const navigate = useNavigate();
  return (
    <Screen>
      <Header title="TIPPER" back="/" />
      <div className="content">
        <h1 className="page-title">Choisissez votre catégorie</h1>
        <button className="btn" style={{ marginBottom: 18 }} onClick={() => navigate('/')}>CHANGER DE RÔLE</button>
        <p className="section-hint">Utilisez ce formulaire pour demander un service aux autres utilisateurs !</p>
        {CATEGORIES.map((c) => (
          <button key={c.key} className="cat-btn" onClick={() => navigate(`/post/${c.key}`)}>
            {c.icon}&nbsp;&nbsp;{c.label}
          </button>
        ))}
      </div>
    </Screen>
  );
}
