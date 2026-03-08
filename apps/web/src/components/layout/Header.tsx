"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationCount } from "@/hooks/useNotificationCount";
import { API_URL } from "@/lib/constants";

export function Header() {
  const { user } = useAuth();
  const { count } = useNotificationCount();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-[720px] mx-auto flex items-center justify-between h-14 px-5">
        <Link href="/" className="text-[15px] font-bold tracking-tight text-black">
          공연알리미
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/search"
            className="text-[13px] text-gray-500 hover:text-black transition-colors duration-300"
          >
            검색
          </Link>
          <Link
            href="/concerts"
            className="text-[13px] text-gray-500 hover:text-black transition-colors duration-300"
          >
            공연
          </Link>
          {user ? (
            <>
              <Link
                href="/my/notifications"
                className="relative text-[13px] text-gray-500 hover:text-black transition-colors duration-300"
              >
                알림
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-3 w-[18px] h-[18px] bg-black text-white text-[10px] flex items-center justify-center rounded-full">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </Link>
              <Link
                href="/my"
                className="text-[13px] text-gray-500 hover:text-black transition-colors duration-300"
              >
                MY
              </Link>
            </>
          ) : (
            <Link
              href={`${API_URL}/auth/kakao`}
              className="text-[13px] font-medium text-black"
            >
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
