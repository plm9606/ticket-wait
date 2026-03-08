"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-[720px] mx-auto flex items-center justify-between h-14 px-5">
        <Link href="/" className="text-lg font-bold tracking-tight text-black">
          공연알리미
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/search"
            className="text-sm text-gray-600 hover:text-black"
          >
            검색
          </Link>
          {user ? (
            <Link
              href="/my"
              className="text-sm text-gray-600 hover:text-black"
            >
              MY
            </Link>
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
