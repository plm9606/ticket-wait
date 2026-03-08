"use client";

import { create } from "zustand";
import { api } from "@/lib/api";

interface NotificationCountState {
  count: number;
  fetch: () => Promise<void>;
}

export const useNotificationCount = create<NotificationCountState>((set) => ({
  count: 0,
  fetch: async () => {
    try {
      const data = await api<{ count: number }>("/notifications/unread-count");
      set({ count: data.count });
    } catch {
      // not logged in or error
    }
  },
}));
