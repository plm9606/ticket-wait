"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationCount } from "@/hooks/useNotificationCount";

export function Header() {
  const { user } = useAuth();
  const { count } = useNotificationCount();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-[720px] mx-auto flex items-center justify-between h-14 px-5">
        <Link href="/" className="text-lg font-bold tracking-tight text-black">
          공연알리미
        </Link>

        <nav className="flex items-center gap-5">
          <Link
            href="/search"
            className="text-sm text-gray-600 hover:text-black transition-colors"
          >
            검색
          </Link>
          <Link
            href="/concerts"
            className="text-sm text-gray-600 hover:text-black transition-colors"
          >
            공연
          </Link>
          {user ? (
            <div className="flex items-center gap-4">
              <Link
                href="/my/notifications"
                className="relative text-sm text-gray-600 hover:text-black transition-colors"
              >
                알림
                {count > 0 && (
                  <span className="absolute -top-1 -right-3 w-4 h-4 bg-black text-white text-[10px] flex items-center justify-center rounded-full">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </Link>
              <Link
                href="/my"
                className="text-sm text-gray-600 hover:text-black transition-colors"
              >
                MY
              </Link>
            </div>
          ) : (
            <Link
              href={`${process.env.NEXT_PUBLIC_API_URL}/auth/kakao`}
              className="text-sm font-medium text-black"
            >
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
