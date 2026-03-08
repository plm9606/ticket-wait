import type { Metadata, Viewport } from "next";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "@/styles/globals.css";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { AuthProvider } from "@/components/layout/AuthProvider";

export const metadata: Metadata = {
  title: "공연알리미 - 좋아하는 아티스트의 공연을 놓치지 마세요",
  description:
    "좋아하는 아티스트를 구독하고, 새로운 공연이 등록되면 알림을 받으세요.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          <Header />
          <main className="min-h-screen">{children}</main>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
