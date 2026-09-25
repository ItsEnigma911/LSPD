import React, { createContext, useContext, useEffect, useState } from "react";
import { api, ApiError } from "../api";
import { User } from "../types";
import { useData } from "./DataContext";

const SESSION_KEY = "lspd_session_user_id";

interface AuthContextValue {
  currentUser: User | null;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // AuthProvider reads the live, synced user list from DataProvider so that
  // profile edits made by anyone (rank, badge, callsign, divisions) show up
  // for the logged-in user automatically as the data polls in.
  return <AuthInner>{children}</AuthInner>;
};

const AuthInner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data } = useData();
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem(SESSION_KEY));

  useEffect(() => {
    if (userId) localStorage.setItem(SESSION_KEY, userId);
    else localStorage.removeItem(SESSION_KEY);
  }, [userId]);

  const currentUser = data.users.find((u) => u.id === userId) ?? null;

  const login: AuthContextValue["login"] = async (username, password) => {
    try {
      const res = await api.post<{ user: User }>("/login", { username, password });
      setUserId(res.user.id);
      return { ok: true };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Couldn't reach the server.";
      return { ok: false, error: message };
    }
  };

  const logout = () => setUserId(null);

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
