"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { UserRole } from "@/api/users/users.types";
import { authClient } from "@/lib/auth-client";

const STORAGE_KEY = "veo:my-space:view-as-user-id";

interface MySpaceViewAsContextValue {
  isAdmin: boolean;
  isSessionLoading: boolean;
  viewAsUserId: string | null;
  setViewAsUserId: (next: string | null) => void;
}

const MySpaceViewAsContext = createContext<MySpaceViewAsContextValue | null>(
  null,
);

// Module-scoped store keeps the React tree in sync with localStorage without
// relying on a setState-in-effect hydration pattern.
type Listener = () => void;
const listeners = new Set<Listener>();

let cachedViewAsUserId: string | null = null;

function readFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value && value.length > 0 ? value : null;
}

if (typeof window !== "undefined") {
  cachedViewAsUserId = readFromStorage();
  // Keep tabs in sync — if the user changes the selection in another tab the
  // local cache and subscribers should follow along.
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    cachedViewAsUserId = readFromStorage();
    listeners.forEach((listener) => listener());
  });
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): string | null {
  return cachedViewAsUserId;
}

function getServerSnapshot(): null {
  return null;
}

function writeToStorage(next: string | null) {
  cachedViewAsUserId = next;
  if (typeof window !== "undefined") {
    if (next === null) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, next);
  }
  listeners.forEach((listener) => listener());
}

export function MySpaceViewAsProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const sessionUser = session?.user as Record<string, unknown> | undefined;
  const userRole = sessionUser?.role as UserRole | undefined;
  const isAdmin = !isPending && userRole === "ADMIN";

  const storedId = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const setViewAsUserId = useCallback((next: string | null) => {
    const value = next && next.trim().length > 0 ? next : null;
    writeToStorage(value);
  }, []);

  const effectiveViewAsUserId = isAdmin ? storedId : null;

  return (
    <MySpaceViewAsContext.Provider
      value={{
        isAdmin,
        isSessionLoading: isPending,
        viewAsUserId: effectiveViewAsUserId,
        setViewAsUserId,
      }}
    >
      {children}
    </MySpaceViewAsContext.Provider>
  );
}

export function useMySpaceViewAs(): MySpaceViewAsContextValue {
  const ctx = useContext(MySpaceViewAsContext);
  if (!ctx) {
    throw new Error(
      "useMySpaceViewAs debe usarse dentro de <MySpaceViewAsProvider>",
    );
  }
  return ctx;
}
