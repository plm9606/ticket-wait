import Link from "next/link";
import { Container } from "@/components/layout/Container";

export default function HomePage() {
  return (
    <>
      {/* 히어로 섹션 */}
      <section className="bg-black text-white py-20 md:py-32">
        <Container>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
            놓치지 마세요
          </h1>
          <p className="mt-4 text-lg text-gray-400 leading-relaxed">
            좋아하는 아티스트를 구독하면
            <br />
            새로운 공연 소식을 알려드립니다.
          </p>
          <Link
            href="/search"
            className="inline-block mt-8 px-8 py-3 bg-white text-black text-sm font-medium rounded-sm hover:opacity-90 transition-opacity"
          >
            아티스트 구독하기
          </Link>
        </Container>
      </section>

      {/* 서비스 소개 */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="grid gap-12 md:grid-cols-3">
            <div>
              <div className="text-2xl mb-3">◎</div>
              <h3 className="text-base font-semibold mb-2">아티스트 검색</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                좋아하는 가수를 검색하고 구독하세요.
              </p>
            </div>
            <div>
              <div className="text-2xl mb-3">♡</div>
              <h3 className="text-base font-semibold mb-2">공연 소식 구독</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                멜론티켓, YES24, 인터파크에서 공연 정보를 수집합니다.
              </p>
            </div>
            <div>
              <div className="text-2xl mb-3">◆</div>
              <h3 className="text-base font-semibold mb-2">푸시 알림</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                새 공연이 등록되면 바로 알림을 보내드립니다.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
