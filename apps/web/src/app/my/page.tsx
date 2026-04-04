"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { Container } from "@/components/layout/Container";
import { EditorialHeadline } from "@/components/shared/EditorialHeadline";
import { API_URL } from "@/lib/constants";

export default function MyPage() {
  const { user, loading: authLoading } = useAuth();
  const { subscriptions, loading: subsLoading, fetch: fetchSubs } = useSubscriptions();

  useEffect(() => {
    if (user) fetchSubs();
  }, [user, fetchSubs]);

  if (authLoading) {
    return (
      <section>
        <EditorialHeadline title="My" />
        <Container>
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-surface-container-low rounded-2xl" />
            <div className="h-4 w-32 bg-surface-container-low rounded" />
          </div>
        </Container>
      </section>
    );
  }

  if (!user) {
    return (
      <section>
        <EditorialHeadline title="My" subtitle="나의 공간" />
        <Container>
          <div className="text-center py-16">
            <p className="text-on-surface-variant text-sm mb-6">
              로그인하고 좋아하는 아티스트를 구독하세요
            </p>
            <Link
              href={`${API_URL}/auth/kakao`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#FEE500] text-[#191919] text-sm font-bold rounded-xl"
            >
              카카오로 시작하기
            </Link>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="pb-24">
      <EditorialHeadline title="My" subtitle="나의 공간" />
      <Container>
        {/* 프로필 */}
        <div className="bg-surface-container-low rounded-2xl p-6 flex items-center gap-4 mb-10">
          <div className="w-14 h-14 rounded-full bg-surface-container overflow-hidden shrink-0 ring-1 ring-outline-variant/20">
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.nickname}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-lg">
                {user.nickname[0]}
              </div>
            )}
          </div>
          <div>
            <div className="font-headline font-bold text-primary">{user.nickname}</div>
            <div className="text-xs text-on-surface-variant mt-0.5">
              {user.email || ""}
            </div>
          </div>
        </div>

        {/* 구독 아티스트 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline font-bold text-xl">
            내 구독{" "}
            <span className="text-on-surface-variant font-normal">
              {subscriptions.length}
            </span>
          </h2>
          <Link
            href="/search"
            className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors"
          >
            + 추가
          </Link>
        </div>

        {subsLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-6 gap-y-10">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse flex flex-col items-center">
                <div className="w-20 h-20 bg-surface-container-low rounded-full" />
                <div className="h-3 w-16 bg-surface-container-low rounded mt-3" />
              </div>
            ))}
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-16 bg-surface-container-low rounded-xl">
            <p className="text-on-surface-variant text-sm mb-4">
              아직 구독한 아티스트가 없어요
            </p>
            <Link
              href="/search"
              className="text-sm font-bold text-primary underline underline-offset-4"
            >
              아티스트 검색하기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-6 gap-y-10">
            {subscriptions.map((sub) => (
              <Link
                key={sub.id}
                href={`/artist/${sub.artistId}`}
                className="flex flex-col items-center group"
              >
                <div className="w-20 h-20 rounded-full bg-surface-container-low overflow-hidden group-hover:scale-95 transition-transform duration-300">
                  {sub.imageUrl ? (
                    <img
                      src={sub.imageUrl}
                      alt={sub.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-xl">
                      {sub.name[0]}
                    </div>
                  )}
                </div>
                <div className="mt-3 text-center">
                  <div className="font-headline font-bold text-sm text-primary truncate max-w-[80px]">
                    {sub.name}
                  </div>
                  {sub.nameEn && (
                    <div className="text-[10px] uppercase tracking-widest text-on-surface-variant mt-1 truncate max-w-[80px]">
                      {sub.nameEn}
                    </div>
                  )}
                  {sub.performanceCount > 0 && (
                    <div className="text-[10px] text-on-surface-variant mt-0.5">
                      공연 {sub.performanceCount}건
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
