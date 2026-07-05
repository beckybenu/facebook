import { destroySession } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api";

export async function POST() {
  try {
    destroySession();
    return jsonOk(null);
  } catch (e) {
    return handleApiError(e);
  }
}
