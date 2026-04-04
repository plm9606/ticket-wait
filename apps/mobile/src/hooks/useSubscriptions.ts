import { create } from "zustand";
import { api } from "@/lib/api";

interface SubscribedArtist {
  id: string;
  artistId: string;
  name: string;
  nameEn: string | null;
  imageUrl: string | null;
  concertCount: number;
  subscribedAt: string;
}

interface SubscriptionState {
  subscriptions: SubscribedArtist[];
  loading: boolean;
  subscribedIds: Set<string>;
  fetch: () => Promise<void>;
  subscribe: (artistId: string) => Promise<void>;
  unsubscribe: (artistId: string) => Promise<void>;
  isSubscribed: (artistId: string) => boolean;
}

export const useSubscriptions = create<SubscriptionState>((set, get) => ({
  subscriptions: [],
  loading: false,
  subscribedIds: new Set(),

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

  subscribe: async (artistId: string) => {
    await api("/subscriptions", {
      method: "POST",
      body: JSON.stringify({ artistId }),
    });
    await get().fetch();
  },

  unsubscribe: async (artistId: string) => {
    await api(`/subscriptions/${artistId}`, { method: "DELETE" });
    await get().fetch();
  },

  isSubscribed: (artistId: string) => {
    return get().subscribedIds.has(artistId);
  },
}));
