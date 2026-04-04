"use client";

import { create } from "zustand";
import { api } from "@/lib/api";

interface SubscribedArtist {
  id: number;
  artistId: number;
  name: string;
  nameEn: string | null;
  imageUrl: string | null;
  performanceCount: number;
  subscribedAt: string;
}

interface SubscriptionState {
  subscriptions: SubscribedArtist[];
  loading: boolean;
  subscribedIds: Set<number>;
  fetch: () => Promise<void>;
  subscribe: (artistId: number) => Promise<void>;
  unsubscribe: (artistId: number) => Promise<void>;
  isSubscribed: (artistId: number) => boolean;
}

export const useSubscriptions = create<SubscriptionState>((set, get) => ({
  subscriptions: [],
  loading: false,
  subscribedIds: new Set<number>(),

  fetch: async () => {
    set({ loading: true });
    try {
      const data = await api<SubscribedArtist[]>("/subscriptions");
      set({
        subscriptions: data,
        subscribedIds: new Set(data.map((s) => s.artistId)),
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  subscribe: async (artistId: number) => {
    await api("/subscriptions", {
      method: "POST",
      body: JSON.stringify({ artistId }),
    });
    // 리스트 다시 로드
    await get().fetch();
  },

  unsubscribe: async (artistId: number) => {
    await api(`/subscriptions/${artistId}`, { method: "DELETE" });
    await get().fetch();
  },

  isSubscribed: (artistId: number) => {
    return get().subscribedIds.has(artistId);
  },
}));
