import { NextRequest } from "next/server";
import { handlers } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Next.js serves this handler under `basePath: "/dsaguardian"`, but it STRIPS
// that prefix from the request before the handler runs — `req.url` arrives as
// "/api/auth/..." with `nextUrl.basePath === ""`. Auth.js, however, is
// configured with `basePath: "/dsaguardian/api/auth"` so it builds correct
// public callback/redirect URLs. To reconcile the two we re-add the stripped
// prefix here, so Auth.js parses the action against the same path it emits.
const BASE_PATH = "/dsaguardian";

function withBasePath(req: NextRequest): NextRequest {
  const url = new URL(req.url);
  if (!url.pathname.startsWith(`${BASE_PATH}/`)) {
    url.pathname = `${BASE_PATH}${url.pathname}`;
  }
  return new NextRequest(url, req);
}

export const GET = (req: NextRequest) => handlers.GET(withBasePath(req));
export const POST = (req: NextRequest) => handlers.POST(withBasePath(req));
