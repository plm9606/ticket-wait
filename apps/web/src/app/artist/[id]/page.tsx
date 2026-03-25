"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { AvatarCircle } from "@/components/ui/AvatarCircle";
import { GradientButton } from "@/components/ui/GradientButton";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { ConcertCard } from "@/components/concert/ConcertCard";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useToast } from "@/hooks/useToast";
import { api } from "@/lib/api";

interface Concert {
  id: string;
  title: string;
  artist: { id: string; name: string; nameEn: string | null } | null;
  venue: string | null;
  startDate: string | null;
  imageUrl: string | null;
  status: string;
}

interface ArtistDetail {
  id: string;
  name: string;
  nameEn: string | null;
  aliases: string[];
  imageUrl: string | null;
  subscriberCount: number;
  concerts: Concert[];
}

export default function ArtistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const { isSubscribed, subscribe, unsubscribe, fetch: fetchSubs } = useSubscriptions();
  const toast = useToast();
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
    if (!user) {
      toast.show("로그인이 필요합니다");
      return;
    }
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
      <section className="pt-8">
        <Container>
          <div className="animate-pulse space-y-6">
            <div className="h-24 w-24 rounded-full bg-surface-low mx-auto" />
            <div className="h-6 w-40 bg-surface-low mx-auto rounded" />
            <div className="h-4 w-24 bg-surface-low mx-auto rounded" />
          </div>
        </Container>
      </section>
    );
  }

  if (!artist) {
    return (
      <section className="pt-16">
        <Container>
          <div className="text-center py-16">
            <p className="text-on-surface-variant text-sm">아티스트를 찾을 수 없습니다</p>
            <Link href="/search" className="text-sm underline underline-offset-4 mt-4 inline-block">
              검색으로 돌아가기
            </Link>
          </div>
        </Container>
      </section>
    );
  }

  const subscribed = isSubscribed(artist.id);

  return (
    <section className="pt-8 pb-24">
      <Container>
        {/* 아티스트 프로필 */}
        <div className="text-center mb-10">
          <AvatarCircle
            src={artist.imageUrl}
            name={artist.name}
            size="xl"
            className="mx-auto"
          />
          <h1 className="text-2xl font-bold font-[family-name:var(--font-manrope)] mt-4">
            {artist.name}
          </h1>
          {artist.nameEn && (
            <p className="text-sm text-on-surface-variant mt-1">{artist.nameEn}</p>
          )}
          <p className="text-xs text-on-surface-variant mt-2">
            구독자 {artist.subscriberCount}명
          </p>

          {/* 구독 버튼 */}
          <div className="mt-6">
            {subscribed ? (
              <button
                onClick={handleToggle}
                disabled={toggling}
                className="px-8 py-2.5 text-sm font-medium rounded-lg bg-surface-low text-on-surface-variant transition-opacity"
              >
                {toggling ? "..." : "구독중"}
              </button>
            ) : (
              <GradientButton onClick={handleToggle} disabled={toggling}>
                {toggling ? "..." : "구독하기"}
              </GradientButton>
            )}
          </div>
        </div>

        {/* 공연 목록 */}
        <div>
          <h2 className="text-lg font-bold font-[family-name:var(--font-manrope)] mb-6">
            공연 <span className="text-on-surface-variant font-normal">{artist.concerts.length}</span>
          </h2>

          {artist.concerts.length === 0 ? (
            <SurfaceCard className="text-center py-12">
              <p className="text-on-surface-variant text-sm">등록된 공연이 없습니다</p>
            </SurfaceCard>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {artist.concerts.map((concert) => (
                <ConcertCard
                  key={concert.id}
                  concert={{ ...concert, artist: { id: artist.id, name: artist.name, nameEn: artist.nameEn } }}
                  variant="vertical"
                />
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
