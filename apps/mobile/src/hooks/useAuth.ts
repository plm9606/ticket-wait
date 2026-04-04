import { create } from "zustand";
import { api } from "@/lib/api";
import { getToken, removeToken, setToken } from "@/lib/auth";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { API_URL } from "@/lib/constants";

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
  login: () => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,

  fetchUser: async () => {
    const token = await getToken();
    if (!token) {
      set({ user: null, loading: false });
      return;
    }
    try {
      const user = await api<User>("/auth/me");
      set({ user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  login: async () => {
    const redirectUrl = Linking.createURL("auth/callback");

    const result = await WebBrowser.openAuthSessionAsync(
      `${API_URL}/auth/kakao/mobile`,
      redirectUrl
    );

    if (result.type === "success" && result.url) {
      const url = new URL(result.url);
      const token = url.searchParams.get("token");
      if (token) {
        await setToken(token);
        const user = await api<User>("/auth/me");
        set({ user });
        return true;
      }
    }
    return false;
  },

  logout: async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    await removeToken();
    set({ user: null });
  },
}));
