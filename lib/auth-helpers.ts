import "server-only";
// Small helpers to read the authenticated app user id in route handlers and
// server components. Returns null when there is no valid session.
import { auth } from "./auth";

export async function getUserId(): Promise<string | null> {
  const session = await auth();
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}
