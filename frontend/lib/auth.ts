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

export function getStoredSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<AuthSession>;

    if (!parsed.token || !parsed.user?.id || !parsed.user.email) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return parsed as AuthSession;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
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
