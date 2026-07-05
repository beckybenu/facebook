import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api";

const schema = z.object({
  bio: z.string().max(500, "La bio ne peut pas dépasser 500 caractères").optional(),
  country: z.string().max(40, "Pays trop long").optional(),
  avatarColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Couleur invalide (format #RRGGBB)")
    .optional(),
  gamertagPsn: z.string().max(40, "Gamertag PSN trop long").optional(),
  gamertagXbox: z.string().max(40, "Gamertag Xbox trop long").optional(),
  gamertagActivision: z
    .string()
    .max(40, "ID Activision trop long")
    .optional(),
  gamertagEpic: z.string().max(40, "Pseudo Epic trop long").optional(),
});

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(body.bio !== undefined && { bio: body.bio }),
        ...(body.country !== undefined && { country: body.country }),
        ...(body.avatarColor !== undefined && {
          avatarColor: body.avatarColor,
        }),
        ...(body.gamertagPsn !== undefined && {
          gamertagPsn: body.gamertagPsn,
        }),
        ...(body.gamertagXbox !== undefined && {
          gamertagXbox: body.gamertagXbox,
        }),
        ...(body.gamertagActivision !== undefined && {
          gamertagActivision: body.gamertagActivision,
        }),
        ...(body.gamertagEpic !== undefined && {
          gamertagEpic: body.gamertagEpic,
        }),
      },
    });

    return jsonOk({ id: updated.id, username: updated.username });
  } catch (e) {
    return handleApiError(e);
  }
}
