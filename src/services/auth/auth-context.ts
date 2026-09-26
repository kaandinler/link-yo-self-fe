"use client";

import { User } from "@/services/api/types/user";
import { createContext } from "react";

/**
 * Token artik istemcide TUTULMUYOR: HttpOnly bir cerezde ve yalnizca
 * Next sunucusu goruyor (bkz. services/auth/session-cookie.ts).
 * Bu yuzden bir AuthTokensContext de yok -- olsaydi, kullanilmadigi
 * halde "token'i burada saklayabilirsin" diyen olu bir arayuz olurdu.
 */

export const AuthContext = createContext<{
  user: User | null;
  isLoaded: boolean;
}>({
  user: null,
  isLoaded: true,
});

export const AuthActionsContext = createContext<{
  setUser: (user: User) => void;
  logOut: () => Promise<void>;
}>({
  setUser: () => {},
  logOut: async () => {},
});
