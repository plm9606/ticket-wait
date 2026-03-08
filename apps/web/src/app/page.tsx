import Link from "next/link";
import { RecentConcerts } from "@/components/concert/RecentConcerts";

export default function HomePage() {
  return (
    <>
      {/* 히어로 */}
      <section className="bg-black text-white">
        <div className="max-w-[720px] mx-auto px-5 pt-28 pb-32 md:pt-40 md:pb-44">
          <h1 className="text-[28px] md:text-[40px] font-light leading-[1.35] tracking-tight">
            놓칠 수 없는
            <br />
            공연을 가장 먼저
          </h1>
          <p className="mt-6 text-[14px] font-light text-gray-500 leading-[1.8]">
            좋아하는 아티스트를 구독하세요.
            <br />
            새로운 공연 소식을 알려드립니다.
          </p>
          <Link
            href="/search"
            className="inline-block mt-12 px-6 py-2.5 border border-gray-600 text-[12px] text-gray-300 font-light tracking-wider hover:border-white hover:text-white transition-all duration-500"
          >
            구독하기
          </Link>
        </div>
      </section>

      {/* 최근 공연 — 이미지 중심 */}
      <section>
        <div className="max-w-[720px] mx-auto px-5 pt-24 md:pt-32 pb-32 md:pb-20">
          <div className="flex items-end justify-between mb-12">
            <h2 className="text-[13px] font-normal tracking-wider text-gray-900">
              최근 등록된 공연
            </h2>
            <Link
              href="/concerts"
              className="text-[11px] text-gray-400 hover:text-gray-900 transition-colors duration-500 tracking-wider"
            >
              전체 보기
            </Link>
          </div>
          <RecentConcerts />
        </div>
      </section>

      {/* 서비스 소개 */}
      <section className="bg-gray-50">
        <div className="max-w-[720px] mx-auto px-5 py-24 md:py-32">
          <div className="grid gap-16 md:grid-cols-3 md:gap-12">
            <div>
              <p className="text-[11px] text-gray-300 tracking-widest mb-4">01</p>
              <h3 className="text-[14px] font-normal leading-[1.7] text-gray-800">
                아티스트를 검색하고
                <br />
                구독하세요
              </h3>
            </div>
            <div>
              <p className="text-[11px] text-gray-300 tracking-widest mb-4">02</p>
              <h3 className="text-[14px] font-normal leading-[1.7] text-gray-800">
                멜론·YES24·인터파크
                <br />
                공연 정보를 수집합니다
              </h3>
            </div>
            <div>
              <p className="text-[11px] text-gray-300 tracking-widest mb-4">03</p>
              <h3 className="text-[14px] font-normal leading-[1.7] text-gray-800">
                새 공연이 등록되면
                <br />
                바로 알림을 보내드려요
              </h3>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
