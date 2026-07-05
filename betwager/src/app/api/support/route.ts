import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api";

const supportSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(3, "Le sujet doit contenir au moins 3 caractères")
    .max(120, "Le sujet ne peut pas dépasser 120 caractères"),
  message: z
    .string()
    .trim()
    .min(10, "Le message doit contenir au moins 10 caractères")
    .max(2000, "Le message ne peut pas dépasser 2000 caractères"),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = supportSchema.parse(await req.json());

    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: `Support : ${body.subject} — ${user.username}`,
          body: body.message,
          href: `/admin/users`,
        })),
      });
    }

    return jsonOk({ sent: true });
  } catch (e) {
    return handleApiError(e);
  }
}
