"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useToast } from "@/hooks/useToast";
import { GradientButton } from "@/components/ui/GradientButton";
import { Badge } from "@/components/ui/Badge";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { AvatarCircle } from "@/components/ui/AvatarCircle";
import { API_URL } from "@/lib/constants";
import { api } from "@/lib/api";
import { formatDateFull, sourceLabel, genreLabel, statusLabel } from "@/lib/format";

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

function statusBadgeVariant(status: string) {
  switch (status) {
    case "ON_SALE": return "green" as const;
    case "SOLD_OUT": return "red" as const;
    case "UPCOMING": return "blue" as const;
    default: return "gray" as const;
  }
}

function statusBadgeLabel(status: string) {
  switch (status) {
    case "ON_SALE": return "티켓 판매중";
    case "SOLD_OUT": return "매진";
    case "UPCOMING": return "티켓 오픈 예정";
    default: return statusLabel(status);
  }
}

export default function ConcertDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { isSubscribed, subscribe, unsubscribe, fetch: fetchSubs } = useSubscriptions();
  const toast = useToast();
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
    if (!user) {
      toast.show("로그인이 필요합니다");
      return;
    }
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
      <section>
        <div className="animate-pulse">
          <div className="w-full aspect-[4/3] max-h-[400px] bg-surface-low" />
          <Container>
            <div className="space-y-4 pt-6">
              <div className="h-8 w-3/4 bg-surface-low rounded" />
              <div className="h-4 w-1/2 bg-surface-low rounded" />
              <div className="h-12 w-full bg-surface-low rounded-lg" />
            </div>
          </Container>
        </div>
      </section>
    );
  }

  if (!concert) {
    return (
      <section className="pt-16">
        <Container>
          <div className="text-center py-16">
            <p className="text-on-surface-variant text-sm">공연을 찾을 수 없습니다</p>
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
    <section className="pb-24">
      {/* 풀폭 히어로 이미지 */}
      <div className="relative w-full aspect-[4/3] max-h-[400px] bg-surface-low">
        {concert.imageUrl ? (
          <img
            src={concert.imageUrl}
            alt={concert.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-sm">
            No Image
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      {/* 콘텐츠 */}
      <Container>
        <div className="space-y-6 pt-2">
          {/* 제목 */}
          <h1 className="text-2xl font-bold font-[family-name:var(--font-manrope)] leading-snug">
            {concert.title}
          </h1>

          {/* 메타 정보 */}
          <div className="text-sm text-on-surface-variant">
            {formatDateFull(concert.startDate)}
            {concert.endDate && concert.endDate !== concert.startDate
              ? ` ~ ${formatDateFull(concert.endDate)}`
              : ""}
            {concert.venue && ` · ${concert.venue}`}
            {" · 약 120분"}
          </div>

          {/* 상태 뱃지 */}
          <div className="flex items-center gap-2">
            <Badge variant={statusBadgeVariant(concert.status)}>
              {statusBadgeLabel(concert.status)}
            </Badge>
            <Badge variant="gray">{genreLabel(concert.genre)}</Badge>
            <Badge variant="gray">{sourceLabel(concert.source)}</Badge>
          </div>

          {/* 가격 */}
          <p className="text-sm text-on-surface-variant">가격 정보 확인</p>

          {/* 예매 CTA */}
          <GradientButton
            href={concert.sourceUrl}
            fullWidth
          >
            예매하기
          </GradientButton>

          {/* 공연 소개 */}
          <SurfaceCard>
            <h2 className="text-base font-bold font-[family-name:var(--font-manrope)] mb-3">
              공연 소개
            </h2>
            <div className="text-sm text-on-surface-variant leading-relaxed space-y-2">
              <p>{concert.title}</p>
              {concert.venue && <p>장소: {concert.venue}</p>}
              <p>일시: {formatDateFull(concert.startDate)}</p>
              {concert.ticketOpenDate && (
                <p>티켓 오픈: {formatDateFull(concert.ticketOpenDate)}</p>
              )}
            </div>
          </SurfaceCard>

          {/* 아티스트 */}
          {concert.artist && (
            <SurfaceCard>
              <h2 className="text-base font-bold font-[family-name:var(--font-manrope)] mb-4">
                아티스트
              </h2>
              <div className="flex items-center gap-4">
                <Link href={`/artist/${concert.artist.id}`} className="shrink-0">
                  <AvatarCircle
                    src={concert.artist.imageUrl}
                    name={concert.artist.name}
                    size="lg"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/artist/${concert.artist.id}`}
                    className="font-semibold hover:opacity-70 transition-opacity"
                  >
                    {concert.artist.name}
                  </Link>
                  {concert.artist.nameEn && (
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {concert.artist.nameEn}
                    </p>
                  )}
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    구독자 {concert.artist.subscriberCount}명
                  </p>
                </div>
                <div className="shrink-0">
                  {subscribed ? (
                    <button
                      onClick={handleToggle}
                      disabled={toggling}
                      className="px-5 py-2 text-sm font-medium rounded-lg bg-surface-low text-on-surface-variant transition-opacity"
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
            </SurfaceCard>
          )}
        </div>
      </Container>
    </section>
  );
}
