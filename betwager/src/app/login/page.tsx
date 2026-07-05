import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = { title: "Connexion — Betwager" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md py-8">
      <div className="card px-8 py-10">
        <div className="mb-8 text-center">
          <span className="text-4xl">⚔️</span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
            Bon retour, champion
          </h1>
          <p className="mt-2 text-sm text-muted">
            Connectez-vous pour retrouver vos matchs, vos tournois et votre
            cagnotte.
          </p>
        </div>

        <LoginForm />

        <p className="mt-6 text-center text-sm text-muted">
          Pas encore de compte ?{" "}
          <Link
            href="/register"
            className="font-semibold text-accent hover:underline"
          >
            Créer un compte
          </Link>
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-edge bg-surface px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          Comptes de démonstration
        </p>
        <div className="mt-2 space-y-1 text-sm text-slate-300">
          <p>
            <span className="text-muted">Admin :</span>{" "}
            <code className="text-accent">admin@betwager.gg</code> /{" "}
            <code>Betwager123!</code>
          </p>
          <p>
            <span className="text-muted">Joueur :</span>{" "}
            <code className="text-accent">shadow@demo.gg</code> /{" "}
            <code>Betwager123!</code>
          </p>
        </div>
      </div>
    </div>
  );
}
