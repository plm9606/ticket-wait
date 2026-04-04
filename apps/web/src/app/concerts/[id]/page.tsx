"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { API_URL } from "@/lib/constants";
import { api } from "@/lib/api";

interface PerformanceDetail {
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

function getDday(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const diff = Math.ceil(
    (new Date(dateStr).getTime() - Date.now()) / 86400000
  );
  if (diff < 0) return null;
  if (diff === 0) return "D-DAY";
  return `D-${diff}`;
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
  const [performance, setPerformance] = useState<PerformanceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await api<PerformanceDetail>(`/performances/${id}`);
        setPerformance(data);
      } catch {
        setPerformance(null);
      } finally {
        setLoading(false);
      }
    }
    load();
    if (user) fetchSubs();
  }, [id, user, fetchSubs]);

  const handleToggle = async () => {
    if (!performance?.artist || toggling) return;
    setToggling(true);
    try {
      if (isSubscribed(performance.artist.id)) {
        await unsubscribe(performance.artist.id);
      } else {
        await subscribe(performance.artist.id);
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
        <div className="w-full h-[60vh] min-h-[400px] bg-gray-100 animate-pulse" />
        <Container>
          <div className="-mt-10 relative z-10 bg-white p-8 rounded-xl">
            <div className="h-6 w-48 bg-gray-100 rounded mb-4" />
            <div className="h-12 w-full bg-gray-100 rounded-xl" />
          </div>
          <div className="mt-10 space-y-4">
            <div className="h-4 w-24 bg-gray-100 rounded" />
            <div className="h-6 w-48 bg-gray-100 rounded" />
          </div>
        </Container>
      </section>
    );
  }

  if (!performance) {
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

  const subscribed = performance.artist ? isSubscribed(performance.artist.id) : false;
  const dday = getDday(performance.ticketOpenDate);

  return (
    <section className="pb-24">
      {/* 풀블리드 히어로 */}
      <div className="relative w-full h-[60vh] min-h-[400px] bg-black overflow-hidden">
        {performance.imageUrl ? (
          <img
            src={performance.imageUrl}
            alt={performance.title}
            className="w-full h-full object-cover opacity-70 grayscale"
          />
        ) : (
          <div className="w-full h-full bg-gray-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="max-w-[720px] mx-auto">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white text-[11px] font-semibold tracking-widest uppercase">
              {genreLabel(performance.genre)}
            </span>
            <h1 className="mt-3 text-4xl md:text-6xl font-black tracking-tighter leading-none text-white">
              {performance.title}
            </h1>
            <div className="mt-4 flex flex-wrap gap-5 text-white/80 text-sm">
              {performance.startDate && (
                <span>{formatDate(performance.startDate)}</span>
              )}
              {performance.venue && <span>{performance.venue}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions 카드 */}
      <Container>
        <div className="-mt-10 relative z-10 bg-white p-6 md:p-8 rounded-xl shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                상태
              </span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-gray-900 animate-pulse" />
                <span className="text-xl font-bold tracking-tight">
                  {statusLabel(performance.status)}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              {performance.artist && (
                user ? (
                  <button
                    onClick={handleToggle}
                    disabled={toggling}
                    className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-colors ${
                      subscribed
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    }`}
                  >
                    {toggling
                      ? "..."
                      : subscribed
                        ? "구독 중"
                        : "알림 받기"}
                  </button>
                ) : (
                  <Link
                    href={`${API_URL}/auth/kakao`}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-100 text-gray-900 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
                  >
                    알림 받기
                  </Link>
                )
              )}
              <a
                href={performance.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-8 py-3.5 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors shadow-lg"
              >
                예매하기
              </a>
            </div>
          </div>
        </div>

        {/* 티켓 오픈일 */}
        {performance.ticketOpenDate && (
          <div className="mt-10 py-8 border-t border-gray-200">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
              Ticket Open
            </span>
            <p className="text-2xl font-bold tracking-tight mt-1">
              {formatDate(performance.ticketOpenDate)}
            </p>
            {dday && (
              <p className="text-sm text-gray-400 mt-1">{dday}</p>
            )}
          </div>
        )}

        {/* 공연 정보 */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-6 py-8 border-t border-gray-100">
          {performance.venue && (
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                Venue
              </span>
              <p className="text-sm text-gray-800 mt-1">{performance.venue}</p>
            </div>
          )}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
              Source
            </span>
            <p className="text-sm text-gray-800 mt-1">
              {sourceLabel(performance.source)}
            </p>
          </div>
          <div className="col-span-2">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
              Date
            </span>
            <p className="text-sm text-gray-800 mt-1">
              {formatDate(performance.startDate)}
              {performance.endDate && performance.endDate !== performance.startDate
                ? ` — ${formatDate(performance.endDate)}`
                : ""}
            </p>
          </div>
        </div>

        {/* 아티스트 섹션 */}
        {performance.artist && (
          <div className="border-t border-gray-100 pt-10 pb-4">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
              Artist
            </span>
            <div className="flex items-center gap-4 mt-6">
              <Link
                href={`/artist/${performance.artist.id}`}
                className="shrink-0"
              >
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  {performance.artist.imageUrl ? (
                    <img
                      src={performance.artist.imageUrl}
                      alt={performance.artist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-300 text-lg">
                      {performance.artist.name[0]}
                    </span>
                  )}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/artist/${performance.artist.id}`}
                  className="font-bold text-[15px] hover:underline underline-offset-4"
                >
                  {performance.artist.name}
                </Link>
                {performance.artist.nameEn && (
                  <p className="text-[11px] text-gray-400 tracking-wide mt-0.5">
                    {performance.artist.nameEn}
                  </p>
                )}
                <p className="text-[11px] text-gray-300 mt-0.5">
                  구독자 {performance.artist.subscriberCount}명
                </p>
              </div>
              <div className="shrink-0">
                {user ? (
                  <button
                    onClick={handleToggle}
                    disabled={toggling}
                    className={`px-5 py-2 text-sm font-bold rounded-xl transition-colors ${
                      subscribed
                        ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        : "bg-black text-white hover:bg-gray-800"
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
                    className="px-5 py-2 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors"
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
