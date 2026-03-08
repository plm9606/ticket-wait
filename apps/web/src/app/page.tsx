import Link from "next/link";
import { RecentConcerts } from "@/components/concert/RecentConcerts";
import { ScrollFadeIn } from "@/components/common/ScrollFadeIn";

export default function HomePage() {
  return (
    <>
      {/* 풀스크린 히어로 */}
      <section className="-mt-14 relative bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-[11px] tracking-[0.3em] text-gray-500 uppercase mb-8">
            Concert Alert
          </p>
          <h1 className="text-[32px] md:text-[56px] font-light leading-[1.3] tracking-tight">
            놓칠 수 없는
            <br />
            공연을 가장 먼저
          </h1>
          <p className="mt-8 text-[14px] md:text-[15px] font-light text-gray-500 leading-[2]">
            좋아하는 아티스트를 구독하세요
            <br />
            새로운 공연 소식을 알려드립니다
          </p>
          <Link
            href="/search"
            className="inline-block mt-14 px-10 py-3 border border-gray-600 text-[11px] text-gray-400 font-light tracking-[0.2em] uppercase hover:border-white hover:text-white transition-all duration-500"
          >
            Subscribe
          </Link>
        </div>
        {/* 스크롤 유도 */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <div className="w-[1px] h-12 bg-gray-700 mx-auto animate-pulse" />
        </div>
      </section>

      {/* 최근 공연 — 풀와이드 */}
      <section className="py-28 md:py-40">
        <div className="max-w-[1080px] mx-auto px-6 md:px-10">
          <ScrollFadeIn>
            <div className="flex items-end justify-between mb-14">
              <div>
                <p className="text-[10px] tracking-[0.3em] text-gray-400 uppercase mb-3">
                  Recent
                </p>
                <h2 className="text-[18px] md:text-[22px] font-light tracking-tight">
                  최근 등록된 공연
                </h2>
              </div>
              <Link
                href="/concerts"
                className="text-[11px] text-gray-400 hover:text-gray-900 tracking-[0.15em] transition-colors duration-500"
              >
                전체 보기
              </Link>
            </div>
          </ScrollFadeIn>
          <ScrollFadeIn delay={0.15}>
            <RecentConcerts />
          </ScrollFadeIn>
        </div>
      </section>

      {/* 서비스 소개 */}
      <section className="bg-gray-50 py-28 md:py-40">
        <div className="max-w-[1080px] mx-auto px-6 md:px-10">
          <ScrollFadeIn>
            <p className="text-[10px] tracking-[0.3em] text-gray-400 uppercase mb-16 md:mb-20">
              How it works
            </p>
          </ScrollFadeIn>
          <div className="grid gap-20 md:grid-cols-3 md:gap-16">
            <ScrollFadeIn delay={0}>
              <p className="text-[11px] text-gray-300 tracking-[0.2em] mb-5">01</p>
              <h3 className="text-[15px] md:text-[16px] font-light leading-[1.8]">
                아티스트를 검색하고
                <br />
                구독하세요
              </h3>
              <p className="mt-4 text-[13px] font-light text-gray-400 leading-[1.8]">
                좋아하는 가수의 이름만 검색하면 됩니다
              </p>
            </ScrollFadeIn>
            <ScrollFadeIn delay={0.1}>
              <p className="text-[11px] text-gray-300 tracking-[0.2em] mb-5">02</p>
              <h3 className="text-[15px] md:text-[16px] font-light leading-[1.8]">
                멜론·YES24·인터파크
                <br />
                공연 정보를 수집합니다
              </h3>
              <p className="mt-4 text-[13px] font-light text-gray-400 leading-[1.8]">
                주요 티켓 플랫폼의 새 공연을 자동으로 모아드려요
              </p>
            </ScrollFadeIn>
            <ScrollFadeIn delay={0.2}>
              <p className="text-[11px] text-gray-300 tracking-[0.2em] mb-5">03</p>
              <h3 className="text-[15px] md:text-[16px] font-light leading-[1.8]">
                새 공연이 등록되면
                <br />
                바로 알림을 보내드려요
              </h3>
              <p className="mt-4 text-[13px] font-light text-gray-400 leading-[1.8]">
                티켓팅 전에 미리 준비할 수 있습니다
              </p>
            </ScrollFadeIn>
          </div>
        </div>
      </section>
    </>
  );
}
