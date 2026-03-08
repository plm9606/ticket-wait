"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationCount } from "@/hooks/useNotificationCount";
import { API_URL } from "@/lib/constants";

export function Header() {
  const { user } = useAuth();
  const { count } = useNotificationCount();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-[1080px] mx-auto flex items-center justify-between h-14 px-6 md:px-10">
        <Link
          href="/"
          className="text-[14px] font-medium tracking-tight text-black"
        >
          공연알리미
        </Link>

        <nav className="flex items-center gap-7">
          <Link
            href="/search"
            className="text-[12px] text-gray-500 hover:text-black tracking-wider transition-colors duration-300"
          >
            검색
          </Link>
          <Link
            href="/concerts"
            className="text-[12px] text-gray-500 hover:text-black tracking-wider transition-colors duration-300"
          >
            공연
          </Link>
          {user ? (
            <>
              <Link
                href="/my/notifications"
                className="relative text-[12px] text-gray-500 hover:text-black tracking-wider transition-colors duration-300"
              >
                알림
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-3 w-[16px] h-[16px] bg-black text-white text-[9px] flex items-center justify-center rounded-full">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </Link>
              <Link
                href="/my"
                className="text-[12px] text-gray-500 hover:text-black tracking-wider transition-colors duration-300"
              >
                MY
              </Link>
            </>
          ) : (
            <Link
              href={`${API_URL}/auth/kakao`}
              className="text-[12px] font-medium text-black tracking-wider"
            >
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
