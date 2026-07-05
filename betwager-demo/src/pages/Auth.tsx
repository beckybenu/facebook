import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../store";

export function Login() {
  const { login } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = login(email, password);
    if (!res.ok) setError(res.error);
    else navigate("/");
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-8">
        <h1 className="text-2xl font-black text-white">Bon retour 👋</h1>
        <p className="mt-1 text-sm text-muted">
          Connectez-vous pour retrouver vos matchs et votre portefeuille.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            Se connecter
          </button>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </form>
        <p className="mt-5 text-center text-sm text-muted">
          Pas encore de compte ?{" "}
          <Link to="/register" className="font-semibold text-accent hover:underline">
            Inscrivez-vous
          </Link>
        </p>
      </div>
      <div className="card mt-4 p-5 text-sm text-muted">
        <p className="font-semibold text-slate-300">Comptes de démonstration</p>
        <p className="mt-2">
          Admin : <code className="text-accent">admin@betwager.gg</code>
          <br />
          Joueur : <code className="text-accent">shadow@demo.gg</code>
          <br />
          Mot de passe : <code className="text-accent">Betwager123!</code>
        </p>
      </div>
    </div>
  );
}

export function Register() {
  const { register } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = register(email, username, password);
    if (!res.ok) setError(res.error);
    else navigate("/");
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-8">
        <h1 className="text-2xl font-black text-white">Rejoignez l'arène 🏆</h1>
        <p className="mt-1 text-sm text-muted">
          Inscription gratuite — un bonus de bienvenue de{" "}
          <span className="font-semibold text-accent">5 €</span> vous attend.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="r-email">Email</label>
            <input
              id="r-email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="r-username">Pseudo</label>
            <input
              id="r-username"
              className="input"
              placeholder="3 à 20 caractères"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="r-password">Mot de passe</label>
            <input
              id="r-password"
              type="password"
              className="input"
              placeholder="8 caractères minimum"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            Créer mon compte
          </button>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </form>
        <p className="mt-5 text-center text-sm text-muted">
          Déjà inscrit ?{" "}
          <Link to="/login" className="font-semibold text-accent hover:underline">
            Connectez-vous
          </Link>
        </p>
      </div>
    </div>
  );
}
