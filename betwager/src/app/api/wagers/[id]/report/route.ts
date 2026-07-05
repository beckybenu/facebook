import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { reportResult, MatchError, WalletError } from "@/lib/match-engine";

const reportSchema = z.object({
  result: z.enum(["WIN", "LOSS"], {
    errorMap: () => ({ message: "Résultat invalide" }),
  }),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const body = reportSchema.parse(await req.json());
    const match = await reportResult(params.id, user.id, body.result);
    return jsonOk(match);
  } catch (e) {
    if (e instanceof MatchError || e instanceof WalletError)
      return jsonError(e.message, 400);
    return handleApiError(e);
  }
}
