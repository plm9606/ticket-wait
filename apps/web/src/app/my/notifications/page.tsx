"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { Badge } from "@/components/ui/Badge";
import { ChannelSettings } from "@/components/alerts/ChannelSettings";
import { AlertCard } from "@/components/alerts/AlertCard";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Search } from "lucide-react";

interface NotificationItem {
  id: string;
  type: string;
  concert: {
    id: string;
    title: string;
    source: string;
    sourceUrl: string;
    imageUrl: string | null;
    status?: string;
    startDate?: string | null;
    venue?: string | null;
    artist: { id: string; name: string; nameEn: string | null } | null;
  };
  read: boolean;
  createdAt: string;
}

interface NotificationResponse {
  items: NotificationItem[];
  nextCursor: string | null;
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");

  const load = useCallback(async (nextCursor?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "20" });
      if (nextCursor) params.set("cursor", nextCursor);
      const data = await api<NotificationResponse>(`/notifications/history?${params}`);
      setNotifications((prev) => nextCursor ? [...prev, ...data.items] : data.items);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const markAsRead = async (id: string) => {
    await api(`/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  if (authLoading) {
    return (
      <section className="pt-8">
        <Container>
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-32 bg-surface-low rounded" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-surface-low rounded-lg" />
            ))}
          </div>
        </Container>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="pt-16">
        <Container>
          <div className="text-center py-16">
            <p className="text-on-surface-variant text-sm">로그인이 필요합니다</p>
          </div>
        </Container>
      </section>
    );
  }

  const filtered = filterQuery
    ? notifications.filter(
        (n) =>
          n.concert.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
          n.concert.artist?.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
          n.concert.venue?.toLowerCase().includes(filterQuery.toLowerCase())
      )
    : notifications;

  const upcoming = filtered.filter((n) => !n.read);
  const past = filtered.filter((n) => n.read);

  return (
    <section className="pt-8 pb-24">
      <Container>
        <div className="space-y-6">
          {/* 헤더 */}
          <div>
            <h1 className="text-2xl font-bold font-[family-name:var(--font-manrope)]">
              알림
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              맞춤 알림으로 공연을 놓치지 마세요
            </p>
          </div>

          {/* 채널 설정 */}
          <ChannelSettings />

          {/* 필터 검색 */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="아티스트, 공연, 장소로 필터링"
              className="w-full bg-surface-lowest rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-black"
            />
          </div>

          {/* 예정 섹션 */}
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-base font-bold mb-3">예정</h2>
              <div className="space-y-3">
                {upcoming.map((n) => (
                  <AlertCard
                    key={n.id}
                    notification={n}
                    onRead={() => !n.read && markAsRead(n.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 지난 알림 */}
          {past.length > 0 && (
            <div>
              <h2 className="text-base font-bold mb-3">지난 알림</h2>
              <div className="space-y-3">
                {past.map((n) => (
                  <AlertCard
                    key={n.id}
                    notification={n}
                    onRead={() => {}}
                  />
                ))}
              </div>
            </div>
          )}

          {notifications.length === 0 && !loading && (
            <div className="text-center py-16">
              <p className="text-on-surface-variant text-sm mb-4">아직 알림이 없습니다</p>
              <Link
                href="/search"
                className="text-sm text-black underline underline-offset-4"
              >
                아티스트를 구독해보세요
              </Link>
            </div>
          )}

          {loading && (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse h-20 bg-surface-low rounded-lg" />
              ))}
            </div>
          )}

          {hasMore && !loading && (
            <button
              onClick={() => cursor && load(cursor)}
              className="w-full py-3 text-sm text-on-surface-variant bg-surface-lowest rounded-lg"
            >
              더 보기
            </button>
          )}
        </div>
      </Container>
    </section>
  );
}
