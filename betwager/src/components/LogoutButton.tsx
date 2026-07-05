"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
      className="hidden text-sm font-medium text-muted transition-colors hover:text-danger sm:block"
      title="Se déconnecter"
    >
      Déconnexion
    </button>
  );
}
