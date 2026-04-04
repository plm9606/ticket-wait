"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationCount } from "@/hooks/useNotificationCount";
import { API_URL } from "@/lib/constants";

export function Header() {
  const { user } = useAuth();
  const { count } = useNotificationCount();

  return (
    <header className="sticky top-0 z-50 w-full bg-surface/80 backdrop-blur-md">
      <div className="flex justify-between items-center px-6 h-16">
        <Link href="/" className="font-headline font-black tracking-tighter text-2xl text-on-surface">
          공연알리미
        </Link>

        <nav className="flex items-center gap-5">
          <Link
            href="/search"
            className="text-sm text-on-surface-variant hover:text-on-surface transition-colors hidden md:block"
          >
            검색
          </Link>
          <Link
            href="/concerts"
            className="text-sm text-on-surface-variant hover:text-on-surface transition-colors hidden md:block"
          >
            공연
          </Link>
          {user ? (
            <div className="flex items-center gap-4">
              <Link
                href="/my/notifications"
                className="relative text-sm text-on-surface-variant hover:text-on-surface transition-colors hidden md:block"
              >
                알림
                {count > 0 && (
                  <span className="absolute -top-1 -right-3 w-4 h-4 bg-primary text-white text-[10px] flex items-center justify-center rounded-full">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </Link>
              <Link href="/my" className="block">
                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden ring-1 ring-outline-variant/20">
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.nickname}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                  )}
                </div>
              </Link>
            </div>
          ) : (
            <Link
              href={`${API_URL}/auth/kakao`}
              className="text-sm font-medium text-on-surface"
            >
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
