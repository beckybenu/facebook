import { useNavigate } from 'react-router-dom';
import { Screen, Header } from '../components/Layout.jsx';
import { useApp } from '../context/AppContext.jsx';

export function Role() {
  const navigate = useNavigate();
  const { logout } = useApp();
  return (
    <Screen>
      <Header
        title="TIPPER"
        back={null}
        right={<button className="icon-btn" onClick={logout} title="Déconnexion">⏻</button>}
      />
      <div className="content">
        <h1 className="page-title center">Choisissez votre rôle</h1>

        <div className="role-block">
          <div className="lead">Je cherche et j'attend</div>
          <button className="btn" onClick={() => navigate('/categories')}>SERVICES</button>
          <div className="desc">Utilisez ce bouton pour demander des services aux autres utilisateurs !</div>
          <div className="role-illus">🔎👥</div>
        </div>

        <div className="role-block">
          <div className="lead">Je trouve et je gagne</div>
          <button className="btn" onClick={() => navigate('/feed')}>POURBOIRES</button>
          <div className="desc">Utilisez ce bouton pour rendre des services aux autres utilisateurs !</div>
          <div className="role-illus">🌍💁‍♀️💰</div>
        </div>
      </div>
    </Screen>
  );
}
