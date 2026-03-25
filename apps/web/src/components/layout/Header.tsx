"use client";

import Link from "next/link";
import { Search, Bell, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationCount } from "@/hooks/useNotificationCount";
import { API_URL } from "@/lib/constants";

export function Header() {
  const { user } = useAuth();
  const { count } = useNotificationCount();

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="max-w-[720px] mx-auto flex items-center justify-between h-14 px-5">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-black font-[family-name:var(--font-manrope)]"
        >
          Backstage
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/search" className="text-on-surface-variant">
            <Search size={20} strokeWidth={1.8} />
          </Link>

          {user ? (
            <>
              <Link
                href="/my/notifications"
                className="relative text-on-surface-variant"
              >
                <Bell size={20} strokeWidth={1.8} />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-black text-white text-[10px] flex items-center justify-center rounded-full">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </Link>
              <Link href="/my" className="text-on-surface-variant">
                <User size={20} strokeWidth={1.8} />
              </Link>
            </>
          ) : (
            <Link
              href={`${API_URL}/auth/kakao`}
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
