"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PerformanceListCard } from "@/components/shared/PerformanceListCard";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { API_URL } from "@/lib/constants";
import { api } from "@/lib/api";

interface Performance {
  id: number;
  title: string;
  venue: { id: number; name: string } | null;
  startDate: string | null;
  endDate: string | null;
  source: string;
  sourceUrl: string;
  imageUrl: string | null;
  status: string;
}

interface ArtistDetail {
  id: number;
  name: string;
  nameEn: string | null;
  aliases: string[];
  imageUrl: string | null;
  subscriberCount: number;
  performances: Performance[];
}

export default function ArtistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const { isSubscribed, subscribe, unsubscribe, fetch: fetchSubs } = useSubscriptions();
  const [artist, setArtist] = useState<ArtistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await api<ArtistDetail>(`/artists/${id}`);
        setArtist(data);
      } catch {
        setArtist(null);
      } finally {
        setLoading(false);
      }
    }
    load();
    if (user) fetchSubs();
  }, [id, user, fetchSubs]);

  const handleToggle = async () => {
    if (!artist || toggling) return;
    setToggling(true);
    try {
      if (isSubscribed(artist.id)) {
        await unsubscribe(artist.id);
      } else {
        await subscribe(artist.id);
      }
    } catch {
      // ignore
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <section>
        <div className="bg-surface-container-low py-12 px-6">
          <div className="max-w-[720px] mx-auto animate-pulse flex items-center gap-6">
            <div className="w-28 h-28 rounded-full bg-surface-container shrink-0" />
            <div className="space-y-3">
              <div className="h-8 w-48 bg-surface-container rounded" />
              <div className="h-4 w-24 bg-surface-container rounded" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!artist) {
    return (
      <section className="pt-16">
        <Container>
          <div className="text-center py-16">
            <p className="text-on-surface-variant text-sm">아티스트를 찾을 수 없습니다</p>
            <Link href="/search" className="text-sm underline underline-offset-4 mt-4 inline-block text-on-surface-variant">
              검색으로 돌아가기
            </Link>
          </div>
        </Container>
      </section>
    );
  }

  const subscribed = isSubscribed(artist.id);

  return (
    <section className="pb-24">
      {/* 아티스트 프로필 — 에디토리얼 좌정렬 */}
      <div className="bg-surface-container-low py-12 px-6">
        <div className="max-w-[720px] mx-auto flex items-center gap-6">
          <div className="w-28 h-28 rounded-full bg-surface-container overflow-hidden shrink-0 shadow-sm">
            {artist.imageUrl ? (
              <img
                src={artist.imageUrl}
                alt={artist.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-3xl">
                {artist.name[0]}
              </div>
            )}
          </div>
          <div>
            <h1 className="font-headline font-black text-4xl tracking-tighter text-primary">
              {artist.name}
            </h1>
            {artist.nameEn && (
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mt-2">
                {artist.nameEn}
              </p>
            )}
            <p className="text-xs text-on-surface-variant mt-2">
              구독자 {artist.subscriberCount}명
            </p>

            {/* 구독 버튼 */}
            {user ? (
              <button
                onClick={handleToggle}
                disabled={toggling}
                className={`mt-4 px-8 py-3 rounded-xl text-sm font-bold transition-all ${
                  subscribed
                    ? "bg-surface-container-high text-on-surface"
                    : "bg-primary text-on-primary hover:opacity-80"
                }`}
              >
                {toggling
                  ? "..."
                  : subscribed
                    ? "구독 중"
                    : "구독하기"}
              </button>
            ) : (
              <Link
                href={`${API_URL}/auth/kakao`}
                className="mt-4 inline-block px-8 py-3 bg-primary text-on-primary rounded-xl text-sm font-bold hover:opacity-80 transition-opacity"
              >
                로그인하고 구독하기
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 공연 목록 */}
      <Container>
        <div className="mt-10">
          <h2 className="font-headline font-bold text-xl mb-6">
            공연{" "}
            <span className="text-on-surface-variant font-normal">
              {artist.performances.length}
            </span>
          </h2>

          {artist.performances.length === 0 ? (
            <div className="text-center py-12 bg-surface-container-low rounded-xl">
              <p className="text-on-surface-variant text-sm">등록된 공연이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {artist.performances.map((performance) => (
                <PerformanceListCard key={performance.id} performance={performance} />
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
