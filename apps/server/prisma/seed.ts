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

async function main() {
  console.log("Seeding artists...");

  for (const artist of artists) {
    await prisma.artist.upsert({
      where: { id: artist.nameEn ?? artist.name },
      update: {},
      create: {
        name: artist.name,
        nameEn: artist.nameEn,
        aliases: artist.aliases,
      },
    });
  }

  console.log(`Seeded ${artists.length} artists.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
