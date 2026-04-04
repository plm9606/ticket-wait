"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { API_URL } from "@/lib/constants";
import { api } from "@/lib/api";

interface ConcertDetail {
  id: string;
  title: string;
  venue: string | null;
  startDate: string | null;
  endDate: string | null;
  ticketOpenDate: string | null;
  source: string;
  sourceUrl: string;
  imageUrl: string | null;
  genre: string;
  status: string;
  artist: {
    id: string;
    name: string;
    nameEn: string | null;
    imageUrl: string | null;
    aliases: string[];
    subscriberCount: number;
  } | null;
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

function genreLabel(genre: string) {
  switch (genre) {
    case "CONCERT": return "콘서트";
    case "FESTIVAL": return "페스티벌";
    case "FANMEETING": return "팬미팅";
    case "MUSICAL": return "뮤지컬";
    case "CLASSIC": return "클래식";
    case "HIPHOP": return "힙합/R&B";
    case "TROT": return "트로트";
    case "OTHER": return "기타";
    default: return genre;
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "UPCOMING":
      return "예정";
    case "ON_SALE":
      return "판매중";
    case "SOLD_OUT":
      return "매진";
    case "COMPLETED":
      return "종료";
    case "CANCELLED":
      return "취소";
    default:
      return status;
  }
}

export default function ConcertDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const { isSubscribed, subscribe, unsubscribe, fetch: fetchSubs } = useSubscriptions();
  const [concert, setConcert] = useState<ConcertDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await api<ConcertDetail>(`/concerts/${id}`);
        setConcert(data);
      } catch {
        setConcert(null);
      } finally {
        setLoading(false);
      }
    }
    load();
    if (user) fetchSubs();
  }, [id, user, fetchSubs]);

  const handleToggle = async () => {
    if (!concert?.artist || toggling) return;
    setToggling(true);
    try {
      if (isSubscribed(concert.artist.id)) {
        await unsubscribe(concert.artist.id);
      } else {
        await subscribe(concert.artist.id);
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
            <div className="aspect-[3/4] max-w-xs mx-auto bg-gray-100 rounded-md" />
            <div className="h-6 w-3/4 bg-gray-100 rounded mx-auto" />
            <div className="h-4 w-1/2 bg-gray-100 rounded mx-auto" />
          </div>
        </Container>
      </section>
    );
  }

  if (!concert) {
    return (
      <section className="pt-16">
        <Container>
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">공연을 찾을 수 없습니다</p>
            <Link
              href="/concerts"
              className="text-sm underline underline-offset-4 mt-4 inline-block"
            >
              공연 목록으로 돌아가기
            </Link>
          </div>
        </Container>
      </section>
    );
  }

  const subscribed = concert.artist ? isSubscribed(concert.artist.id) : false;

  return (
    <section className="pt-8 pb-24">
      <Container>
        {/* 공연 포스터 */}
        <div className="max-w-xs mx-auto mb-8">
          <div className="aspect-[3/4] bg-gray-50 rounded-md overflow-hidden">
            {concert.imageUrl ? (
              <img
                src={concert.imageUrl}
                alt={concert.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-200 text-sm">
                No Image
              </div>
            )}
          </div>
        </div>

        {/* 공연 정보 */}
        <div className="text-center mb-10">
          <h1 className="text-xl font-bold leading-snug">{concert.title}</h1>

          <div className="mt-4 space-y-1.5">
            {concert.venue && (
              <p className="text-sm text-gray-500">{concert.venue}</p>
            )}
            <p className="text-sm text-gray-500">
              {formatDate(concert.startDate)}
              {concert.endDate && concert.endDate !== concert.startDate
                ? ` ~ ${formatDate(concert.endDate)}`
                : ""}
            </p>
            {concert.ticketOpenDate && (
              <p className="text-sm text-gray-400">
                티켓 오픈 {formatDate(concert.ticketOpenDate)}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 mt-4">
            <span className="text-xs text-gray-300">
              {sourceLabel(concert.source)}
            </span>
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500">
              {genreLabel(concert.genre)}
            </span>
            <span className="text-xs text-gray-300">
              {statusLabel(concert.status)}
            </span>
          </div>

          {/* 예매 링크 */}
          <a
            href={concert.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block px-8 py-2.5 bg-black text-white text-sm font-medium hover:opacity-80 transition-opacity"
          >
            {sourceLabel(concert.source)}에서 예매하기
          </a>
        </div>

        {/* 아티스트 정보 */}
        {concert.artist && (
          <div className="border-t border-gray-100 pt-8">
            <h2 className="text-lg font-bold mb-6">아티스트</h2>
            <div className="flex items-center gap-4">
              <Link
                href={`/artist/${concert.artist.id}`}
                className="shrink-0"
              >
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  {concert.artist.imageUrl ? (
                    <img
                      src={concert.artist.imageUrl}
                      alt={concert.artist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-300 text-xl">
                      {concert.artist.name[0]}
                    </span>
                  )}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/artist/${concert.artist.id}`}
                  className="font-semibold hover:underline underline-offset-4"
                >
                  {concert.artist.name}
                </Link>
                {concert.artist.nameEn && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {concert.artist.nameEn}
                  </p>
                )}
                <p className="text-xs text-gray-300 mt-0.5">
                  구독자 {concert.artist.subscriberCount}명
                </p>
              </div>
              <div className="shrink-0">
                {user ? (
                  <button
                    onClick={handleToggle}
                    disabled={toggling}
                    className={`px-5 py-2 text-sm font-medium transition-all ${
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
                    href={`${API_URL}/auth/kakao`}
                    className="px-5 py-2 bg-black text-white text-sm font-medium hover:opacity-80 transition-opacity"
                  >
                    구독하기
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
