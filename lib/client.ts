"use client";

// Next.js basePath doesn't automatically prefix raw fetch() calls, so we
// read it once here and prepend it to every request URL.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// If the session has expired, the API returns 401. Reload so the server-rendered
// layout re-evaluates auth and shows the sign-in screen.
function handleUnauthorized(status: number) {
  if (status === 401 && typeof window !== "undefined") {
    window.location.reload();
  }
}

export const fetcher = (url: string) =>
  fetch(`${BASE_PATH}${url}`).then(async (r) => {
    if (!r.ok) {
      handleUnauthorized(r.status);
      throw new Error((await r.json().catch(() => ({}))).error || r.statusText);
    }
    return r.json();
  });

export async function post<T = unknown>(url: string, body?: unknown): Promise<T> {
  const r = await fetch(`${BASE_PATH}${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) {
    handleUnauthorized(r.status);
    throw new Error(json.error || r.statusText);
  }
  return json as T;
}

export async function patch<T = unknown>(url: string, body?: unknown): Promise<T> {
  const r = await fetch(`${BASE_PATH}${url}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) {
    handleUnauthorized(r.status);
    throw new Error(json.error || r.statusText);
  }
  return json as T;
}

export async function del<T = unknown>(url: string, body?: unknown): Promise<T> {
  const r = await fetch(`${BASE_PATH}${url}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) {
    handleUnauthorized(r.status);
    throw new Error(json.error || r.statusText);
  }
  return json as T;
}

export const DIFF_COLOR: Record<string, string> = {
  Easy: "text-easy",
  Medium: "text-medium",
  Hard: "text-hard",
};
