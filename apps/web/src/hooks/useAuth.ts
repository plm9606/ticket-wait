"use client";

import { create } from "zustand";
import { api } from "@/lib/api";

interface User {
  id: number;
  nickname: string;
  email: string | null;
  profileImage: string | null;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,

  fetchUser: async () => {
    try {
      const user = await api<User>("/auth/me");
      set({ user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  logout: async () => {
    await api("/auth/logout", { method: "POST" });
    set({ user: null });
  },
}));
