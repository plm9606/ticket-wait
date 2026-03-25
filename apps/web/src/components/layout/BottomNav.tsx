"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Bell, User } from "lucide-react";
import { useNotificationCount } from "@/hooks/useNotificationCount";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/", label: "홈", icon: Home },
  { href: "/concerts", label: "탐색", icon: Compass },
  { href: "/my/notifications", label: "알림", icon: Bell },
  { href: "/my", label: "프로필", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const { count } = useNotificationCount();
  const { user } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass md:hidden no-select">
      <div className="max-w-[720px] mx-auto flex items-center justify-around h-16 pb-safe">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : item.href === "/my"
                ? pathname === "/my"
                : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-1 py-2 px-4 text-xs transition-colors ${
                isActive ? "text-black font-medium" : "text-gray-400"
              }`}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span>{item.label}</span>
              {item.href === "/my/notifications" && user && count > 0 && (
                <span className="absolute top-1 right-2 w-2 h-2 bg-black rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
