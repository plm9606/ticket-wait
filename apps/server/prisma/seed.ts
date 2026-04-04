import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const artists = [
  // K-pop 그룹
  { name: "방탄소년단", nameEn: "BTS", aliases: ["방탄", "비티에스", "Bangtan"] },
  { name: "블랙핑크", nameEn: "BLACKPINK", aliases: ["블핑"] },
  { name: "에스파", nameEn: "aespa", aliases: [] },
  { name: "뉴진스", nameEn: "NewJeans", aliases: ["뉴진"] },
  { name: "르세라핌", nameEn: "LE SSERAFIM", aliases: [] },
  { name: "아이브", nameEn: "IVE", aliases: [] },
  { name: "스트레이 키즈", nameEn: "Stray Kids", aliases: ["스키즈", "SKZ"] },
  { name: "세븐틴", nameEn: "SEVENTEEN", aliases: ["세봉", "SVT"] },
  { name: "엔시티", nameEn: "NCT", aliases: ["NCT 127", "NCT DREAM", "WayV"] },
  { name: "투모로우바이투게더", nameEn: "TXT", aliases: ["투바투", "TOMORROW X TOGETHER"] },
  { name: "엔하이픈", nameEn: "ENHYPEN", aliases: [] },
  { name: "트와이스", nameEn: "TWICE", aliases: [] },
  { name: "레드벨벳", nameEn: "Red Velvet", aliases: ["레벨"] },
  { name: "(여자)아이들", nameEn: "(G)I-DLE", aliases: ["아이들", "G-IDLE"] },
  { name: "있지", nameEn: "ITZY", aliases: [] },
  { name: "에이티즈", nameEn: "ATEEZ", aliases: [] },
  { name: "더보이즈", nameEn: "THE BOYZ", aliases: [] },
  { name: "엑소", nameEn: "EXO", aliases: ["엑쏘"] },
  { name: "갓세븐", nameEn: "GOT7", aliases: [] },
  { name: "빅뱅", nameEn: "BIGBANG", aliases: [] },
  { name: "샤이니", nameEn: "SHINee", aliases: [] },
  { name: "마마무", nameEn: "MAMAMOO", aliases: [] },
  { name: "오마이걸", nameEn: "OH MY GIRL", aliases: [] },
  { name: "위너", nameEn: "WINNER", aliases: [] },
  { name: "아이콘", nameEn: "iKON", aliases: [] },
  { name: "몬스타엑스", nameEn: "MONSTA X", aliases: ["몬엑"] },
  { name: "보이넥스트도어", nameEn: "BOYNEXTDOOR", aliases: [] },
  { name: "제로베이스원", nameEn: "ZEROBASEONE", aliases: ["ZB1"] },
  { name: "라이즈", nameEn: "RIIZE", aliases: [] },
  { name: "엔씨티 위시", nameEn: "NCT WISH", aliases: [] },
  { name: "키스오브라이프", nameEn: "KISS OF LIFE", aliases: ["키오라"] },
  { name: "일리릿", nameEn: "ILLIT", aliases: [] },
  { name: "베이비몬스터", nameEn: "BABYMONSTER", aliases: ["베몬"] },
  { name: "트레저", nameEn: "TREASURE", aliases: [] },
  { name: "피프티피프티", nameEn: "FIFTY FIFTY", aliases: [] },

  // 솔로 아티스트
  { name: "아이유", nameEn: "IU", aliases: ["이지은"] },
  { name: "태연", nameEn: "TAEYEON", aliases: [] },
  { name: "백현", nameEn: "BAEKHYUN", aliases: [] },
  { name: "지드래곤", nameEn: "G-DRAGON", aliases: ["GD", "권지용"] },
  { name: "임영웅", nameEn: "Lim Young Woong", aliases: [] },
  { name: "이찬원", nameEn: "Lee Chan Won", aliases: [] },
  { name: "박효신", nameEn: "Park Hyo Shin", aliases: [] },
  { name: "성시경", nameEn: "Sung Si Kyung", aliases: [] },
  { name: "이무진", nameEn: "Lee Mujin", aliases: [] },
  { name: "정국", nameEn: "Jung Kook", aliases: ["전정국", "JK"] },
  { name: "지민", nameEn: "Jimin", aliases: ["박지민"] },
  { name: "뷔", nameEn: "V", aliases: ["김태형", "Taehyung"] },
  { name: "슈가", nameEn: "SUGA", aliases: ["Agust D", "민윤기"] },
  { name: "제니", nameEn: "JENNIE", aliases: [] },
  { name: "로제", nameEn: "ROSÉ", aliases: ["로즈"] },
  { name: "리사", nameEn: "LISA", aliases: [] },
  { name: "지수", nameEn: "JISOO", aliases: [] },
  { name: "아이엔", nameEn: "I.N", aliases: [] },
  { name: "현진", nameEn: "Hyunjin", aliases: [] },
  { name: "윤하", nameEn: "Younha", aliases: [] },
  { name: "헤이즈", nameEn: "Heize", aliases: [] },
  { name: "아이키", nameEn: "Aiki", aliases: [] },
  { name: "딘", nameEn: "DEAN", aliases: [] },
  { name: "크러쉬", nameEn: "Crush", aliases: [] },
  { name: "자이언티", nameEn: "Zion.T", aliases: [] },
  { name: "박재범", nameEn: "Jay Park", aliases: [] },
  { name: "쏘아", nameEn: "Soa", aliases: [] },

  // 밴드 & 인디
  { name: "데이식스", nameEn: "DAY6", aliases: [] },
  { name: "잔나비", nameEn: "Jannabi", aliases: [] },
  { name: "혁오", nameEn: "Hyukoh", aliases: [] },
  { name: "넬", nameEn: "NELL", aliases: [] },
  { name: "10cm", nameEn: "10cm", aliases: ["십센치"] },
  { name: "볼빨간사춘기", nameEn: "BOL4", aliases: ["볼빨간", "볼사"] },
  { name: "악뮤", nameEn: "AKMU", aliases: ["악동뮤지션"] },
  { name: "씨엔블루", nameEn: "CNBLUE", aliases: [] },
  { name: "엔플라잉", nameEn: "N.Flying", aliases: [] },
  { name: "더로즈", nameEn: "The Rose", aliases: [] },
  { name: "실리카겔", nameEn: "Silica Gel", aliases: [] },
  { name: "새소년", nameEn: "SE SO NEON", aliases: [] },
  { name: "소란", nameEn: "Soran", aliases: [] },
  { name: "브로큰발렌타인", nameEn: "Broken Valentines", aliases: [] },
  { name: "검정치마", nameEn: "The Black Skirts", aliases: [] },
  { name: "이날치", nameEn: "Leenalchi", aliases: [] },
  { name: "루시", nameEn: "LUCY", aliases: [] },
  { name: "QWER", nameEn: "QWER", aliases: [] },

  // 힙합 & R&B
  { name: "지코", nameEn: "ZICO", aliases: [] },
  { name: "이영지", nameEn: "Lee Young Ji", aliases: [] },
  { name: "pH-1", nameEn: "pH-1", aliases: [] },
  { name: "우원재", nameEn: "Woo Won Jae", aliases: [] },
  { name: "래원", nameEn: "Lae Won", aliases: [] },
  { name: "창모", nameEn: "CHANGMO", aliases: [] },
  { name: "염따", nameEn: "YUMDDA", aliases: [] },
  { name: "기리보이", nameEn: "Giriboy", aliases: [] },
  { name: "릴보이", nameEn: "Lil Boi", aliases: [] },
  { name: "BewhY", nameEn: "BewhY", aliases: ["비와이"] },
  { name: "식케이", nameEn: "Sik-K", aliases: [] },
  { name: "코드쿤스트", nameEn: "Code Kunst", aliases: [] },
  { name: "그레이", nameEn: "GRAY", aliases: [] },

  // 트로트
  { name: "송가인", nameEn: "Song Ga In", aliases: [] },
  { name: "영탁", nameEn: "Young Tak", aliases: [] },
  { name: "장민호", nameEn: "Jang Min Ho", aliases: [] },
  { name: "김호중", nameEn: "Kim Ho Joong", aliases: [] },

  // 해외 아티스트 (한국 공연 다수)
  { name: "브루노 마스", nameEn: "Bruno Mars", aliases: [] },
  { name: "콜드플레이", nameEn: "Coldplay", aliases: [] },
  { name: "테일러 스위프트", nameEn: "Taylor Swift", aliases: [] },
  { name: "에드 시런", nameEn: "Ed Sheeran", aliases: [] },
  { name: "빌리 아일리시", nameEn: "Billie Eilish", aliases: [] },
  { name: "오아시스", nameEn: "Oasis", aliases: [] },
  { name: "라디오헤드", nameEn: "Radiohead", aliases: [] },
  { name: "린킨 파크", nameEn: "Linkin Park", aliases: [] },
  { name: "요네즈 켄시", nameEn: "Kenshi Yonezu", aliases: ["米津玄師"] },
  { name: "후지이 카제", nameEn: "Fujii Kaze", aliases: ["藤井風"] },
];

// 샘플 공연 데이터
function generateConcerts(artistMap: Map<string, string>) {
  const venues = [
    "KSPO DOME", "올림픽공원 올림픽홀", "잠실종합운동장 주경기장",
    "고척스카이돔", "세종문화회관 대극장", "블루스퀘어 마스터카드홀",
    "YES24 LIVE HALL", "롤링홀", "무신사 개러지",
    "인터파크 유니플렉스", "경희대 평화의 전당", "연세대 노천극장",
    "부산 벡스코", "대구 엑스코", "광주 김대중컨벤션센터",
  ];

  const now = new Date();
  const concerts: {
    title: string;
    artistName: string;
    venue: string;
    startDate: Date;
    endDate: Date | null;
    ticketOpenDate: Date | null;
    source: "MELON" | "YES24" | "INTERPARK";
    sourceId: string;
    sourceUrl: string;
    img: string;
    rawTitle: string;
    genre: string;
    status: string;
  }[] = [];

  // picsum 이미지 (시드 고정, 공연 포스터 비율 3:4)
  const img = (id: number) => `https://picsum.photos/seed/concert${id}/600/800`;

  const concertData = [
    { artistName: "아이유", title: "2026 IU CONCERT : The Winning", venue: "잠실종합운동장 주경기장", genre: "CONCERT", daysFromNow: 30, img: img(1) },
    { artistName: "방탄소년단", title: "BTS WORLD TOUR 'LOVE YOURSELF' SEOUL", venue: "잠실종합운동장 주경기장", genre: "CONCERT", daysFromNow: 45, img: img(2) },
    { artistName: "블랙핑크", title: "BLACKPINK WORLD TOUR [BORN PINK] FINALE IN SEOUL", venue: "고척스카이돔", genre: "CONCERT", daysFromNow: 60, img: img(3) },
    { artistName: "뉴진스", title: "NewJeans 1st Fan Meeting 'Bunnies Camp'", venue: "KSPO DOME", genre: "FANMEETING", daysFromNow: 14, img: img(4) },
    { artistName: "에스파", title: "aespa LIVE TOUR - SYNK : PARALLEL LINE", venue: "KSPO DOME", genre: "CONCERT", daysFromNow: 20, img: img(5) },
    { artistName: "세븐틴", title: "SEVENTEEN TOUR 'FOLLOW' AGAIN IN SEOUL", venue: "고척스카이돔", genre: "CONCERT", daysFromNow: 35, img: img(6) },
    { artistName: "데이식스", title: "DAY6 CONCERT <FOREVER YOUNG>", venue: "올림픽공원 올림픽홀", genre: "CONCERT", daysFromNow: 10, img: img(7) },
    { artistName: "잔나비", title: "잔나비 소극장 콘서트 '가을밤에 든 생각'", venue: "블루스퀘어 마스터카드홀", genre: "CONCERT", daysFromNow: 7, img: img(8) },
    { artistName: "임영웅", title: "임영웅 전국투어 콘서트 IM HERO", venue: "KSPO DOME", genre: "CONCERT", daysFromNow: 25, img: img(9) },
    { artistName: "콜드플레이", title: "Coldplay : Music of the Spheres World Tour in Seoul", venue: "잠실종합운동장 주경기장", genre: "CONCERT", daysFromNow: 90, img: img(10) },
    { artistName: "브루노 마스", title: "Bruno Mars Live in Seoul 2026", venue: "고척스카이돔", genre: "CONCERT", daysFromNow: 50, img: img(11) },
    { artistName: "르세라핌", title: "LE SSERAFIM FAN MEETING 'FEARNADA'", venue: "KSPO DOME", genre: "FANMEETING", daysFromNow: 18, img: img(12) },
    { artistName: "스트레이 키즈", title: "Stray Kids 5TH FANMEETING 'SKZ'S MAGIC SCHOOL'", venue: "KSPO DOME", genre: "FANMEETING", daysFromNow: 22, img: img(13) },
    { artistName: "혁오", title: "혁오 단독 콘서트 '24'", venue: "YES24 LIVE HALL", genre: "CONCERT", daysFromNow: 5, img: img(14) },
    { artistName: "실리카겔", title: "실리카겔 단독 공연 'POWER ROCK'", venue: "무신사 개러지", genre: "CONCERT", daysFromNow: 3, img: img(15) },
    { artistName: "지코", title: "ZICO LIVE : SPOT! IN SEOUL", venue: "올림픽공원 올림픽홀", genre: "HIPHOP", daysFromNow: 12, img: img(16) },
    { artistName: "태연", title: "TAEYEON CONCERT - The ODD Of LOVE", venue: "KSPO DOME", genre: "CONCERT", daysFromNow: 40, img: img(17) },
    { artistName: "아이브", title: "IVE THE 1ST WORLD TOUR 'SHOW WHAT I HAVE' IN SEOUL", venue: "KSPO DOME", genre: "CONCERT", daysFromNow: 55, img: img(18) },
    { artistName: "10cm", title: "10cm 콘서트 <Hello, Goodbye>", venue: "블루스퀘어 마스터카드홀", genre: "CONCERT", daysFromNow: 8, img: img(19) },
    { artistName: "악뮤", title: "AKMU 전국투어 콘서트 '항해'", venue: "경희대 평화의 전당", genre: "CONCERT", daysFromNow: 28, img: img(20) },
    // 이미 지난 공연들 (COMPLETED)
    { artistName: "엑소", title: "EXO PLANET #6 - THE EXO'rdium IN SEOUL", venue: "고척스카이돔", genre: "CONCERT", daysFromNow: -10, img: img(21) },
    { artistName: "트와이스", title: "TWICE 5TH WORLD TOUR 'READY TO BE' IN SEOUL", venue: "KSPO DOME", genre: "CONCERT", daysFromNow: -20, img: img(22) },
    { artistName: "QWER", title: "QWER 1st Concert '알밤'", venue: "YES24 LIVE HALL", genre: "CONCERT", daysFromNow: -5, img: img(23) },
    // 티켓 오픈 임박
    { artistName: "박효신", title: "2026 박효신 콘서트 SOULS", venue: "세종문화회관 대극장", genre: "CONCERT", daysFromNow: 70, img: img(24) },
    { artistName: "성시경", title: "성시경 연말 콘서트 '축제'", venue: "올림픽공원 올림픽홀", genre: "CONCERT", daysFromNow: 80, img: img(25) },
    // 페스티벌
    { artistName: "에스파", title: "2026 서울재즈페스티벌", venue: "올림픽공원", genre: "FESTIVAL", daysFromNow: 65, img: img(26) },
    { artistName: "혁오", title: "2026 펜타포트 록 페스티벌", venue: "인천 송도 달빛축제공원", genre: "FESTIVAL", daysFromNow: 75, img: img(27) },
    // 뮤지컬
    { artistName: "윤하", title: "뮤지컬 '빈센트 반 고흐' (윤하 출연)", venue: "블루스퀘어 마스터카드홀", genre: "MUSICAL", daysFromNow: 15, img: img(28) },
  ];

  const sources: ("MELON" | "YES24" | "INTERPARK")[] = ["MELON", "YES24", "INTERPARK"];

  concertData.forEach((c, i) => {
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() + c.daysFromNow);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (Math.random() > 0.5 ? 1 : 0));

    const ticketOpenDate = new Date(startDate);
    ticketOpenDate.setDate(ticketOpenDate.getDate() - 14);

    const source = sources[i % 3];
    const status = c.daysFromNow < 0 ? "COMPLETED" : c.daysFromNow <= 14 ? "ON_SALE" : "UPCOMING";

    concerts.push({
      title: c.title,
      artistName: c.artistName,
      venue: c.venue,
      startDate,
      endDate,
      ticketOpenDate: ticketOpenDate > now ? ticketOpenDate : null,
      source,
      sourceId: `seed-${source.toLowerCase()}-${i + 1}`,
      sourceUrl: `https://ticket.example.com/${source.toLowerCase()}/${i + 1}`,
      img: c.img,
      rawTitle: c.title,
      genre: c.genre,
      status,
    });
  });

  return concerts;
}

async function main() {
  console.log("Seeding artists...");

  const artistMap = new Map<string, string>();

  for (const artist of artists) {
    const created = await prisma.artist.upsert({
      where: {
        id: `seed-${artist.nameEn?.toLowerCase().replace(/[^a-z0-9]/g, "-") ?? artist.name}`,
      },
      update: {
        name: artist.name,
        nameEn: artist.nameEn,
        aliases: artist.aliases,
      },
      create: {
        id: `seed-${artist.nameEn?.toLowerCase().replace(/[^a-z0-9]/g, "-") ?? artist.name}`,
        name: artist.name,
        nameEn: artist.nameEn,
        aliases: artist.aliases,
      },
    });
    artistMap.set(artist.name, created.id);
  }

  console.log(`Seeded ${artists.length} artists.`);

  console.log("Seeding performances...");

  const performances = generateConcerts(artistMap);

  for (const perf of performances) {
    const artistId = artistMap.get(perf.artistName) ?? null;
    await prisma.performance.upsert({
      where: {
        source_sourceId: {
          source: perf.source,
          sourceId: perf.sourceId,
        },
      },
      update: {
        title: perf.title,
        startDate: perf.startDate,
        endDate: perf.endDate,
        ticketOpenDate: perf.ticketOpenDate,
        status: perf.status as any,
        genre: perf.genre as any,
      },
      create: {
        title: perf.title,
        artistId,
        startDate: perf.startDate,
        endDate: perf.endDate,
        ticketOpenDate: perf.ticketOpenDate,
        source: perf.source,
        sourceId: perf.sourceId,
        sourceUrl: perf.sourceUrl,
        imageUrl: perf.img,
        rawTitle: perf.rawTitle,
        genre: perf.genre as any,
        status: perf.status as any,
      },
    });
  }

  console.log(`Seeded ${performances.length} performances.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
