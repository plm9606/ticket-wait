"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { api } from "@/lib/api";

interface Concert {
  id: string;
  title: string;
  venue: string | null;
  startDate: string | null;
  endDate: string | null;
  source: string;
  sourceUrl: string;
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

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function sourceLabel(source: string) {
  switch (source) {
    case "INTERPARK":
      return "인터파크";
    case "YES24":
      return "YES24";
    case "MELON":
      return "멜론티켓";
    default:
      return source;
  }
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
      <section className="pt-8">
        <Container>
          <div className="animate-pulse space-y-6">
            <div className="h-24 w-24 rounded-full bg-gray-100 mx-auto" />
            <div className="h-6 w-40 bg-gray-100 mx-auto rounded" />
            <div className="h-4 w-24 bg-gray-100 mx-auto rounded" />
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
            <p className="text-gray-400 text-sm">아티스트를 찾을 수 없습니다</p>
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
          <div className="w-24 h-24 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center overflow-hidden">
            {artist.imageUrl ? (
              <img
                src={artist.imageUrl}
                alt={artist.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-300 text-3xl">{artist.name[0]}</span>
            )}
          </div>
          <h1 className="text-2xl font-bold">{artist.name}</h1>
          {artist.nameEn && (
            <p className="text-sm text-gray-400 mt-1">{artist.nameEn}</p>
          )}
          <p className="text-xs text-gray-300 mt-2">
            구독자 {artist.subscriberCount}명
          </p>

          {/* 구독 버튼 */}
          {user ? (
            <button
              onClick={handleToggle}
              disabled={toggling}
              className={`mt-6 px-8 py-2.5 text-sm font-medium transition-all ${
                subscribed
                  ? "border border-gray-200 text-gray-500 hover:border-black hover:text-black"
                  : "bg-black text-white hover:opacity-80"
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
              href={`${process.env.NEXT_PUBLIC_API_URL}/auth/kakao`}
              className="mt-6 inline-block px-8 py-2.5 bg-black text-white text-sm font-medium hover:opacity-80 transition-opacity"
            >
              로그인하고 구독하기
            </Link>
          )}
        </div>

        {/* 공연 목록 */}
        <div>
          <h2 className="text-lg font-bold mb-6">
            공연 <span className="text-gray-300 font-normal">{artist.concerts.length}</span>
          </h2>

          {artist.concerts.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-200 rounded-md">
              <p className="text-gray-400 text-sm">등록된 공연이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-4">
              {artist.concerts.map((concert) => (
                <a
                  key={concert.id}
                  href={concert.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border border-gray-100 p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex gap-4">
                    {concert.imageUrl && (
                      <div className="w-16 h-22 shrink-0 bg-gray-50 overflow-hidden">
                        <img
                          src={concert.imageUrl}
                          alt={concert.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium leading-snug line-clamp-2">
                        {concert.title}
                      </div>
                      {concert.venue && (
                        <div className="text-xs text-gray-400 mt-1.5">
                          {concert.venue}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        {formatDate(concert.startDate)}
                        {concert.endDate && concert.endDate !== concert.startDate
                          ? ` ~ ${formatDate(concert.endDate)}`
                          : ""}
                      </div>
                      <div className="text-xs text-gray-300 mt-1.5">
                        {sourceLabel(concert.source)}
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
