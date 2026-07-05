import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { SupportForm } from "@/components/support/SupportForm";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Contactez l'équipe support de Betwager : email, Discord ou formulaire de contact.",
};

export default async function SupportPage() {
  const user = await getCurrentUser();

  return (
    <div>
      <PageHeader
        title="Support"
        subtitle="Un problème, une question, un litige ? Notre équipe est là pour vous aider."
      />

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Canaux de contact */}
        <div className="space-y-4 lg:col-span-2">
          <div className="card p-6">
            <h2 className="flex items-center gap-3 font-bold text-white">
              <span className="text-2xl">✉️</span> Par email
            </h2>
            <p className="mt-3 text-sm text-muted">
              Pour toute demande, écrivez-nous à
            </p>
            <p className="mt-1 font-semibold text-accent">support@betwager.gg</p>
          </div>

          <div className="card p-6">
            <h2 className="flex items-center gap-3 font-bold text-white">
              <span className="text-2xl">💬</span> Sur Discord
            </h2>
            <p className="mt-3 text-sm text-muted">
              Rejoignez la communauté Betwager pour une aide rapide entre
              joueurs et un accès direct aux modérateurs.
            </p>
            <p className="mt-1 font-semibold text-violet">discord.gg/betwager</p>
          </div>

          <div className="card p-6">
            <h2 className="flex items-center gap-3 font-bold text-white">
              <span className="text-2xl">⏱️</span> Délais de réponse
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li className="flex justify-between gap-4">
                <span>Litiges de match</span>
                <span className="font-semibold text-white">sous 12 h</span>
              </li>
              <li className="flex justify-between gap-4">
                <span>Paiements et retraits</span>
                <span className="font-semibold text-white">sous 24 h</span>
              </li>
              <li className="flex justify-between gap-4">
                <span>Questions générales</span>
                <span className="font-semibold text-white">sous 48 h</span>
              </li>
            </ul>
          </div>

          <div className="card border-gold/30 p-6">
            <p className="text-sm text-muted">
              💡 Pensez d&apos;abord à consulter la{" "}
              <Link href="/faq" className="font-semibold text-gold hover:underline">
                FAQ
              </Link>{" "}
              — la plupart des questions y trouvent une réponse immédiate.
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <div className="card p-8 lg:col-span-3">
          <h2 className="text-xl font-bold text-white">Envoyer une demande</h2>
          <p className="mt-2 text-sm text-muted">
            Votre message est transmis directement à notre équipe, qui vous
            répondra par notification et par email.
          </p>
          <div className="mt-6">
            {user ? (
              <SupportForm />
            ) : (
              <div className="flex flex-col items-center gap-4 rounded-lg border border-edge bg-elevated px-6 py-10 text-center">
                <span className="text-3xl">🔒</span>
                <p className="font-semibold text-white">
                  Connectez-vous pour contacter le support
                </p>
                <p className="max-w-sm text-sm text-muted">
                  Le formulaire de contact est réservé aux membres afin que
                  nous puissions rattacher votre demande à votre compte.
                </p>
                <div className="flex gap-3">
                  <Link href="/login" className="btn-primary">
                    Se connecter
                  </Link>
                  <Link href="/register" className="btn-secondary">
                    Créer un compte
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
