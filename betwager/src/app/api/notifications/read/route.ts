import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api";

export async function POST() {
  try {
    const user = await requireUser();
    const result = await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
    return jsonOk({ updated: result.count });
  } catch (e) {
    return handleApiError(e);
  }
}
