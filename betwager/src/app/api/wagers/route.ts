import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { createMatch, MatchError, WalletError } from "@/lib/match-engine";

const createSchema = z.object({
  gameId: z.string().min(1, "Choisissez un jeu"),
  title: z
    .string()
    .min(3, "Le titre doit contenir au moins 3 caractères")
    .max(80, "Le titre ne peut pas dépasser 80 caractères"),
  rules: z
    .string()
    .max(1000, "Les règles ne peuvent pas dépasser 1000 caractères")
    .default(""),
  platform: z.enum(["PS5", "XBOX", "PC", "CROSS"], {
    errorMap: () => ({ message: "Plateforme invalide" }),
  }),
  region: z.enum(["EU", "NA", "ASIA"], {
    errorMap: () => ({ message: "Région invalide" }),
  }),
  teamSize: z
    .number()
    .int()
    .min(1, "Taille d'équipe invalide")
    .max(4, "Taille d'équipe invalide"),
  entryFeeCents: z
    .number()
    .int("La mise doit être un montant valide")
    .min(100, "La mise minimale est de 1 €")
    .max(50000, "La mise maximale est de 500 €"),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = createSchema.parse(await req.json());
    const match = await createMatch({
      creatorId: user.id,
      gameId: body.gameId,
      title: body.title,
      rules: body.rules,
      platform: body.platform,
      region: body.region,
      teamSize: body.teamSize,
      entryFeeCents: body.entryFeeCents,
    });
    return jsonOk(match);
  } catch (e) {
    if (e instanceof MatchError || e instanceof WalletError)
      return jsonError(e.message, 400);
    return handleApiError(e);
  }
}
