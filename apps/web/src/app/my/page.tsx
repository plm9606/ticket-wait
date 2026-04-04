"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { Container } from "@/components/layout/Container";
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
            <div className="h-8 w-48 bg-gray-100 rounded" />
            <div className="h-4 w-32 bg-gray-100 rounded" />
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
            <p className="text-gray-500 text-sm mb-6">
              로그인하고 좋아하는 아티스트를 구독하세요
            </p>
            <Link
              href={`${API_URL}/auth/kakao`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#FEE500] text-[#191919] text-sm font-medium rounded-md"
            >
              카카오로 시작하기
            </Link>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="pt-8 pb-24">
      <Container>
        {/* 프로필 */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.nickname}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-400 text-lg">
                {user.nickname[0]}
              </span>
            )}
          </div>
          <div>
            <div className="font-semibold">{user.nickname}</div>
            <div className="text-xs text-gray-400 mt-0.5">
              {user.email || ""}
            </div>
          </div>
        </div>

        {/* 구독 아티스트 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">
            내 구독{" "}
            <span className="text-gray-300 font-normal">
              {subscriptions.length}
            </span>
          </h2>
          <Link
            href="/search"
            className="text-xs text-gray-400 hover:text-black transition-colors"
          >
            + 추가
          </Link>
        </div>

        {subsLoading ? (
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-100 rounded-md" />
                <div className="h-3 w-16 bg-gray-100 rounded mt-2" />
              </div>
            ))}
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-gray-200 rounded-md">
            <p className="text-gray-400 text-sm mb-4">
              아직 구독한 아티스트가 없어요
            </p>
            <Link
              href="/search"
              className="text-sm font-medium text-black underline underline-offset-4"
            >
              아티스트 검색하기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {subscriptions.map((sub) => (
              <Link
                key={sub.id}
                href={`/artist/${sub.artistId}`}
                className="group"
              >
                <div className="aspect-square bg-gray-50 rounded-md flex items-center justify-center overflow-hidden group-hover:opacity-80 transition-opacity">
                  {sub.imageUrl ? (
                    <img
                      src={sub.imageUrl}
                      alt={sub.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-300 text-2xl">
                      {sub.name[0]}
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <div className="text-xs font-medium truncate">{sub.name}</div>
                  {sub.nameEn && (
                    <div className="text-[10px] text-gray-400 truncate">
                      {sub.nameEn}
                    </div>
                  )}
                  {sub.concertCount > 0 && (
                    <div className="text-[10px] text-gray-300 mt-0.5">
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
