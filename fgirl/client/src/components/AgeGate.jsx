export default function AgeGate({ onConfirm }) {
  return (
    <div className="agegate">
      <div className="agegate-card">
        <div className="logo logo-lg">Fgirl<span>.ch</span></div>
        <h1>Contenu réservé aux adultes</h1>
        <p>
          Ce site est un annuaire de compagnie destiné à un public adulte. En entrant,
          vous certifiez être majeur·e (18 ans ou plus) et accepter de consulter ce type de contenu.
        </p>
        <p className="muted small">
          Démonstration éducative inspirée de Fgirl.ch — aucune transaction réelle, aucun contenu explicite.
        </p>
        <div className="agegate-actions">
          <button className="btn btn-primary" onClick={onConfirm}>J’ai plus de 18 ans — Entrer</button>
          <a className="btn btn-ghost" href="https://www.google.com">Quitter</a>
        </div>
      </div>
    </div>
  );
}
