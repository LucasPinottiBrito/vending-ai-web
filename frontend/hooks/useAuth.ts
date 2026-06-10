"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AUTH_CHANGED_EVENT,
  AUTH_STORAGE_KEY,
  AuthSession,
  AuthUser,
  getStoredSession,
  isAdmin,
  logoutSession,
  refreshCurrentUser,
} from "@/lib/auth";

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(() =>
    getStoredSession(),
  );
  const [isLoading, setIsLoading] = useState(false);

  const reload = useCallback(async () => {
    setIsLoading(true);

    try {
      const refreshed = await refreshCurrentUser();
      setSession(refreshed);
    } catch {
      setSession(getStoredSession());
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutSession();
    setSession(null);
  }, []);

  useEffect(() => {
    function syncSession(event?: Event) {
      if (
        event instanceof StorageEvent &&
        event.key !== AUTH_STORAGE_KEY
      ) {
        return;
      }

      setSession(getStoredSession());
    }

    window.addEventListener(AUTH_CHANGED_EVENT, syncSession);
    window.addEventListener("storage", syncSession);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, syncSession);
      window.removeEventListener("storage", syncSession);
    };
  }, []);

  return useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      token: session?.token ?? null,
      isAuthenticated: Boolean(session?.token),
      isAdmin: isAdmin(session?.user as AuthUser | null),
      isLoading,
      reload,
      logout,
      setSession,
    }),
    [isLoading, logout, reload, session],
  );
}
