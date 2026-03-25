"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useToast } from "@/hooks/useToast";
import { ConcertCard } from "@/components/concert/ConcertCard";

interface Concert {
  id: string;
  title: string;
  artist: { id: string; name: string; nameEn: string | null } | null;
  venue: string | null;
  startDate: string | null;
  imageUrl: string | null;
  status: string;
}

interface Props {
  genre: string;
}

export function TrendingConcerts({ genre }: Props) {
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isSubscribed, subscribe } = useSubscriptions();
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "10" });
      if (genre) params.set("genre", genre);
      const data = await api<{ items: Concert[] }>(`/concerts?${params}`);
      setConcerts(data.items);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [genre]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAlert = async (artistId: string) => {
    if (!user) {
      toast.show("로그인이 필요합니다");
      return;
    }
    if (isSubscribed(artistId)) return;
    try {
      await subscribe(artistId);
      toast.show("알림을 받을 수 있도록 구독했습니다");
    } catch {
      toast.show("구독에 실패했습니다");
    }
  };

  if (loading) {
    return (
      <section>
        <h2 className="text-lg font-bold font-[family-name:var(--font-manrope)] mb-4">
          인기 공연
        </h2>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-4 py-4">
              <div className="w-8 h-6 bg-surface-low rounded" />
              <div className="w-14 h-14 bg-surface-low rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-surface-low rounded w-3/4" />
                <div className="h-3 bg-surface-low rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (concerts.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-bold font-[family-name:var(--font-manrope)] mb-4">
          인기 공연
        </h2>
        <div className="bg-surface-lowest rounded-lg p-6 text-center">
          <p className="text-sm text-on-surface-variant">
            아직 등록된 공연이 없습니다
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-bold font-[family-name:var(--font-manrope)] mb-4">
        인기 공연
      </h2>
      <div className="divide-y divide-surface-low">
        {concerts.map((concert, i) => (
          <ConcertCard
            key={concert.id}
            concert={concert}
            variant="numbered"
            number={i + 1}
            action={
              concert.artist ? (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleAlert(concert.artist!.id);
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-full transition-colors ${
                    isSubscribed(concert.artist.id)
                      ? "bg-surface-low text-on-surface-variant"
                      : "bg-black text-white"
                  }`}
                >
                  <Bell size={12} />
                  {isSubscribed(concert.artist.id) ? "구독중" : "알림 받기"}
                </button>
              ) : undefined
            }
          />
        ))}
      </div>
    </section>
  );
}
