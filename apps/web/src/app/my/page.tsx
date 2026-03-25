"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { Container } from "@/components/layout/Container";
import { AvatarCircle } from "@/components/ui/AvatarCircle";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { API_URL } from "@/lib/constants";

export default function MyPage() {
  const { user, loading: authLoading } = useAuth();
  const { subscriptions, loading: subsLoading, fetch: fetchSubs } = useSubscriptions();

  useEffect(() => {
    if (user) fetchSubs();
  }, [user, fetchSubs]);

  if (authLoading) {
    return (
      <section className="pt-8">
        <Container>
          <div className="animate-pulse space-y-4">
            <div className="h-24 w-24 rounded-full bg-surface-low mx-auto" />
            <div className="h-4 w-32 bg-surface-low rounded mx-auto" />
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
            <p className="text-on-surface-variant text-sm mb-6">
              로그인하고 좋아하는 아티스트를 구독하세요
            </p>
            <GradientButton href={`${API_URL}/auth/kakao`}>
              카카오로 시작하기
            </GradientButton>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="pt-8 pb-24">
      <Container>
        {/* 프로필 */}
        <div className="flex flex-col items-center mb-10">
          <AvatarCircle
            src={user.profileImage}
            name={user.nickname}
            size="xl"
          />
          <div className="mt-4 text-center">
            <div className="font-semibold text-lg">{user.nickname}</div>
            <div className="text-xs text-on-surface-variant mt-0.5">
              {user.email || ""}
            </div>
          </div>
          <Link
            href="/settings"
            className="mt-3 text-xs text-on-surface-variant underline underline-offset-4"
          >
            설정
          </Link>
        </div>

        {/* 구독 아티스트 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold font-[family-name:var(--font-manrope)]">
            내 구독{" "}
            <span className="text-on-surface-variant font-normal">
              {subscriptions.length}
            </span>
          </h2>
          <Link
            href="/search"
            className="text-xs text-on-surface-variant"
          >
            + 추가
          </Link>
        </div>

        {subsLoading ? (
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-surface-low" />
                <div className="h-3 w-12 bg-surface-low rounded mt-2" />
              </div>
            ))}
          </div>
        ) : subscriptions.length === 0 ? (
          <SurfaceCard className="text-center py-12">
            <p className="text-on-surface-variant text-sm mb-4">
              아직 구독한 아티스트가 없어요
            </p>
            <Link
              href="/search"
              className="text-sm font-medium text-black underline underline-offset-4"
            >
              아티스트 검색하기
            </Link>
          </SurfaceCard>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {subscriptions.map((sub) => (
              <Link
                key={sub.id}
                href={`/artist/${sub.artistId}`}
                className="group flex flex-col items-center text-center"
              >
                <AvatarCircle
                  src={sub.imageUrl}
                  name={sub.name}
                  size="lg"
                  className="group-hover:opacity-80 transition-opacity"
                />
                <div className="mt-2">
                  <div className="text-xs font-medium truncate max-w-[80px]">{sub.name}</div>
                  {sub.concertCount > 0 && (
                    <div className="text-[10px] text-on-surface-variant mt-0.5">
                      공연 {sub.concertCount}건
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
