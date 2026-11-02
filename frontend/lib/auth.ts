import { apiRequest } from "@/lib/api";

export type UserRole = "USER" | "ADMIN" | "OPERATOR";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type AuthSession = {
  user: AuthUser;
  token: string;
};

export const AUTH_STORAGE_KEY = "vending-ai-session";
export const AUTH_CHANGED_EVENT = "vending-ai-auth-changed";

function notifyAuthChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
}

// A primitive snapshot stays referentially stable between storage changes.
export function getSessionSnapshot(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage.getItem(AUTH_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function parseSession(raw: string | null | undefined): AuthSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (!parsed.token || !parsed.user?.id || !parsed.user.email) {
      return null;
    }
    return parsed as AuthSession;
  } catch {
    return null;
  }
}

export function getStoredSession(): AuthSession | null {
  return parseSession(getSessionSnapshot());
}

export function subscribeToSession(onChange: () => void): () => void {
  function onStorage(event: StorageEvent) {
    if (event.key === null || event.key === AUTH_STORAGE_KEY) onChange();
  }
  window.addEventListener(AUTH_CHANGED_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(AUTH_CHANGED_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function setStoredSession(session: AuthSession): void {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  notifyAuthChanged();
}

export function clearStoredSession(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    notifyAuthChanged();
  }
}

export function isAdmin(user: AuthUser | null | undefined): boolean {
  return user?.role === "ADMIN";
}

export async function loginWithPassword(input: {
  email: string;
  password: string;
}): Promise<AuthSession> {
  const response = await apiRequest<AuthSession>("/api/auth/login", {
    method: "POST",
    body: input,
    token: null,
  });

  setStoredSession(response.data);
  return response.data;
}

export async function registerWithPassword(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthSession> {
  const response = await apiRequest<AuthSession>("/api/auth/register", {
    method: "POST",
    body: input,
    token: null,
  });

  setStoredSession(response.data);
  return response.data;
}

export async function logoutSession(): Promise<void> {
  const session = getStoredSession();

  try {
    if (session?.token) {
      await apiRequest("/api/auth/logout", {
        method: "POST",
        token: session.token,
      });
    }
  } finally {
    clearStoredSession();
  }
}

export async function refreshCurrentUser(): Promise<AuthSession | null> {
  const session = getStoredSession();

  if (!session?.token) {
    return null;
  }

  const response = await apiRequest<{ user: AuthUser }>("/api/auth/me", {
    token: session.token,
  });

  const refreshed = {
    token: session.token,
    user: response.data.user,
  };

  setStoredSession(refreshed);
  return refreshed;
}
