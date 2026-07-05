import Link from "next/link";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata = { title: "Inscription — Betwager" };

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md py-8">
      <div className="card px-8 py-10">
        <div className="mb-8 text-center">
          <span className="text-4xl">🏆</span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
            Entrez dans l&apos;arène
          </h1>
          <p className="mt-2 text-sm text-muted">
            Créez votre compte, défiez la communauté et empochez vos gains.
          </p>
        </div>

        <div className="mb-6 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-center text-sm text-accent">
          🎁 Bonus de bienvenue : <strong>5,00 €</strong> offerts à
          l&apos;inscription pour lancer votre premier défi !
        </div>

        <RegisterForm />

        <p className="mt-6 text-center text-sm text-muted">
          Déjà inscrit ?{" "}
          <Link
            href="/login"
            className="font-semibold text-accent hover:underline"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
