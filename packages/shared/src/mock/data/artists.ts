export interface MockArtist {
  id: string;
  name: string;
  nameEn: string | null;
  aliases: string[];
  imageUrl: string | null;
  subscriberCount: number;
}

export const mockArtists: MockArtist[] = [
  {
    id: "artist-1",
    name: "아이유",
    nameEn: "IU",
    aliases: ["이지은"],
    imageUrl: null,
    subscriberCount: 1850,
  },
  {
    id: "artist-2",
    name: "뉴진스",
    nameEn: "NewJeans",
    aliases: ["뉴진즈"],
    imageUrl: null,
    subscriberCount: 2100,
  },
  {
    id: "artist-3",
    name: "임영웅",
    nameEn: "Lim Young Woong",
    aliases: ["영웅시대"],
    imageUrl: null,
    subscriberCount: 1620,
  },
  {
    id: "artist-4",
    name: "세븐틴",
    nameEn: "SEVENTEEN",
    aliases: ["SVT"],
    imageUrl: null,
    subscriberCount: 1430,
  },
  {
    id: "artist-5",
    name: "르세라핌",
    nameEn: "LE SSERAFIM",
    aliases: [],
    imageUrl: null,
    subscriberCount: 980,
  },
  {
    id: "artist-6",
    name: "에스파",
    nameEn: "aespa",
    aliases: [],
    imageUrl: null,
    subscriberCount: 1150,
  },
  {
    id: "artist-7",
    name: "박효신",
    nameEn: "Park Hyo Shin",
    aliases: [],
    imageUrl: null,
    subscriberCount: 890,
  },
  {
    id: "artist-8",
    name: "비비",
    nameEn: "BIBI",
    aliases: ["김형서"],
    imageUrl: null,
    subscriberCount: 540,
  },
  {
    id: "artist-9",
    name: "(여자)아이들",
    nameEn: "(G)I-DLE",
    aliases: ["아이들", "여자아이들"],
    imageUrl: null,
    subscriberCount: 1270,
  },
  {
    id: "artist-10",
    name: "데이식스",
    nameEn: "DAY6",
    aliases: [],
    imageUrl: null,
    subscriberCount: 760,
  },
];
