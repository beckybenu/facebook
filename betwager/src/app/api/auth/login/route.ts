import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";

const schema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });
    if (!user) return jsonError("Identifiants invalides", 401);

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) return jsonError("Identifiants invalides", 401);

    await createSession({ id: user.id, role: user.role });

    return jsonOk({ id: user.id, username: user.username });
  } catch (e) {
    return handleApiError(e);
  }
}
