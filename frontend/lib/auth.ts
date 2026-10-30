export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export type StoredUser = {
  id: string;
  username: string;
  email: string;
  accountType: string;
  userType: string | null;
};

/**
 * Calls the backend with the session cookie. The login token itself is an
 * httpOnly cookie, so this code never sees it (and neither can an XSS).
 * The X-CSRF-Protection header is required by the backend on every
 * state-changing request made with the cookie.
 */
export function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);

  headers.set("X-CSRF-Protection", "1");

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
}

/**
 * Display info about the signed-in user (not a credential — only the
 * cookie proves who you are). Null means nobody logged in on this device.
 */
export function getStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: StoredUser): void {
  try {
    localStorage.setItem("user", JSON.stringify(user));
    // tokens used to be kept here; make sure no old copy lingers
    localStorage.removeItem("token");
  } catch {
    // storage unavailable (private mode etc.)
  }
}

/**
 * Ends the session: the backend revokes the token and clears the cookie,
 * then the saved user is removed. The backend call is best effort — local
 * logout must work even if the server is unreachable.
 */
export async function logout(): Promise<void> {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } catch {
    // ignore — still clear the local session below
  }

  try {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  } catch {
    // storage unavailable (private mode etc.)
  }
}
