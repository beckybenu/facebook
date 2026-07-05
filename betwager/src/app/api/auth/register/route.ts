import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { applySingleTransaction } from "@/lib/wallet";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";

const schema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  username: z
    .string()
    .min(3, "Le pseudo doit contenir au moins 3 caractères")
    .max(20, "Le pseudo ne peut pas dépasser 20 caractères")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Le pseudo ne peut contenir que des lettres, chiffres, _ et -"
    ),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());

    const existingEmail = await prisma.user.findUnique({
      where: { email: body.email },
    });
    if (existingEmail) {
      return jsonError("Cette adresse e-mail est déjà utilisée", 400);
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username: body.username },
    });
    if (existingUsername) {
      return jsonError("Ce pseudo est déjà pris", 400);
    }

    const passwordHash = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        email: body.email,
        username: body.username,
        passwordHash,
      },
    });

    await applySingleTransaction({
      userId: user.id,
      type: "BONUS",
      amountCents: 500,
      reference: "Bonus de bienvenue",
    });

    await createSession({ id: user.id, role: user.role });

    return jsonOk({ id: user.id, username: user.username });
  } catch (e) {
    return handleApiError(e);
  }
}
