"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Container } from "@/components/layout/Container";

export default function MyPage() {
  const { user, loading } = useAuth();

  if (loading) {
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
              href={`${process.env.NEXT_PUBLIC_API_URL}/auth/kakao`}
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
    <section className="pt-8">
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

        {/* 구독 아티스트 (추후 Phase 2B에서 구현) */}
        <h2 className="text-lg font-bold mb-6">내 구독</h2>
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
      </Container>
    </section>
  );
}
