"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNotificationCount } from "@/hooks/useNotificationCount";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  {
    href: "/",
    label: "홈",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
  },
  {
    href: "/search",
    label: "검색",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
      </svg>
    ),
  },
  {
    href: "/concerts",
    label: "공연",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
      </svg>
    ),
  },
  {
    href: "/my",
    label: "MY",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const { count } = useNotificationCount();
  const { user } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-white/90 backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.04)] rounded-t-2xl md:hidden no-select">
      {navItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center justify-center px-4 py-1.5 transition-all duration-300 ease-out ${
              isActive
                ? "bg-gray-900 text-white rounded-xl"
                : "text-gray-400 hover:text-gray-900"
            }`}
          >
            <span className="mb-1">{item.icon}</span>
            <span className="font-headline font-medium text-[10px] uppercase tracking-widest">
              {item.label}
            </span>
            {/* MY 탭에 알림 뱃지 */}
            {item.href === "/my" && user && count > 0 && (
              <span className="absolute top-0.5 right-2 w-2 h-2 bg-primary rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
