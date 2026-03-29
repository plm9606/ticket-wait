import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Manrope, Inter } from "next/font/google";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "@/styles/globals.css";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { AuthProvider } from "@/components/layout/AuthProvider";
import { NativeBridgeProvider } from "@/components/layout/NativeBridgeProvider";
import { Toast } from "@/components/ui/Toast";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Backstage - 좋아하는 아티스트의 공연을 놓치지 마세요",
  description:
    "좋아하는 아티스트를 구독하고, 새로운 공연이 등록되면 알림을 받으세요.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f9f9fb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body className={`${manrope.variable} ${inter.variable}`}>
        <AuthProvider>
          <NativeBridgeProvider>
            <Header />
            <main className="min-h-screen">{children}</main>
            <BottomNav />
            <Toast />
          </NativeBridgeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
