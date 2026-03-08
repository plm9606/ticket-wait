"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNotificationCount } from "@/hooks/useNotificationCount";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/", label: "홈", icon: "⌂" },
  { href: "/search", label: "검색", icon: "◎" },
  { href: "/concerts", label: "공연", icon: "♪" },
  { href: "/my", label: "MY", icon: "♡" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { count } = useNotificationCount();
  const { user } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-100 md:hidden no-select">
      <div className="max-w-[720px] mx-auto flex items-center justify-around h-16 pb-safe">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-1 py-2 px-4 text-xs transition-colors ${
                isActive ? "text-black" : "text-gray-400"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
              {/* MY 탭에 알림 뱃지 */}
              {item.href === "/my" && user && count > 0 && (
                <span className="absolute top-1 right-2 w-2 h-2 bg-black rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
