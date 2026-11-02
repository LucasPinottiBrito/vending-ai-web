"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

import {
  getSessionSnapshot,
  isAdmin,
  logoutSession,
  parseSession,
  refreshCurrentUser,
  subscribeToSession,
} from "@/lib/auth";

function getServerSnapshot(): undefined {
  return undefined;
}

export function useAuth() {
  // The server and first hydration render agree before reading browser storage.
  const snapshot = useSyncExternalStore(
    subscribeToSession,
    getSessionSnapshot,
    getServerSnapshot,
  );
  const session = useMemo(() => parseSession(snapshot), [snapshot]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const reload = useCallback(async () => {
    setIsRefreshing(true);

    try {
      await refreshCurrentUser();
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutSession();
  }, []);

  return {
      session,
      user: session?.user ?? null,
      token: session?.token ?? null,
      isAuthenticated: Boolean(session?.token),
      isAdmin: isAdmin(session?.user),
      isLoading: snapshot === undefined || isRefreshing,
      reload,
      logout,
  };
}
