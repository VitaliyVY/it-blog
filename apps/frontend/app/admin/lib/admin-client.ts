export const ADMIN_TOKEN_KEY = "it-blog-admin-token";

export function getApiBase() {
  const api = process.env.NEXT_PUBLIC_API_URL;
  if (!api) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  return api;
}

export function getAdminToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string) {
  window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
}

function withJsonHeaders(init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return { ...init, headers };
}

export async function apiRequest(path: string, init: RequestInit = {}) {
  return fetch(`${getApiBase()}${path}`, withJsonHeaders(init));
}

export async function adminRequest(path: string, init: RequestInit = {}) {
  const token = getAdminToken();
  if (!token) {
    throw new Error("Missing admin token");
  }

  const nextInit = withJsonHeaders(init);
  const headers = new Headers(nextInit.headers);
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(`${getApiBase()}${path}`, { ...nextInit, headers });
}

export async function parseResponse<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.error || "Request failed");
  }

  return (json?.data ?? null) as T;
}
