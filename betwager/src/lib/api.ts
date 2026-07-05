import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "@/lib/auth";
import { WalletError } from "@/lib/wallet";

export function jsonOk(data: unknown, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

/** Convertit les erreurs métier en réponses JSON propres. */
export function handleApiError(error: unknown) {
  if (error instanceof AuthError) return jsonError(error.message, 401);
  if (error instanceof WalletError) return jsonError(error.message, 400);
  if (error instanceof ZodError) {
    const first = error.errors[0];
    return jsonError(first ? first.message : "Données invalides", 400);
  }
  console.error(error);
  return jsonError("Erreur interne du serveur", 500);
}
