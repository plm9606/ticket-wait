export interface MockArtist {
  id: number;
  name: string;
  nameEn: string | null;
  aliases: string[];
  imageUrl: string | null;
  subscriberCount: number;
}

export const mockArtists: MockArtist[] = [
  {
    id: 1,
    name: "아이유",
    nameEn: "IU",
    aliases: ["이지은"],
    imageUrl: null,
    subscriberCount: 1850,
  },
  {
    id: 2,
    name: "뉴진스",
    nameEn: "NewJeans",
    aliases: ["뉴진즈"],
    imageUrl: null,
    subscriberCount: 2100,
  },
  {
    id: 3,
    name: "임영웅",
    nameEn: "Lim Young Woong",
    aliases: ["영웅시대"],
    imageUrl: null,
    subscriberCount: 1620,
  },
  {
    id: 4,
    name: "세븐틴",
    nameEn: "SEVENTEEN",
    aliases: ["SVT"],
    imageUrl: null,
    subscriberCount: 1430,
  },
  {
    id: 5,
    name: "르세라핌",
    nameEn: "LE SSERAFIM",
    aliases: [],
    imageUrl: null,
    subscriberCount: 980,
  },
  {
    id: 6,
    name: "에스파",
    nameEn: "aespa",
    aliases: [],
    imageUrl: null,
    subscriberCount: 1150,
  },
  {
    id: 7,
    name: "박효신",
    nameEn: "Park Hyo Shin",
    aliases: [],
    imageUrl: null,
    subscriberCount: 890,
  },
  {
    id: 8,
    name: "비비",
    nameEn: "BIBI",
    aliases: ["김형서"],
    imageUrl: null,
    subscriberCount: 540,
  },
  {
    id: 9,
    name: "(여자)아이들",
    nameEn: "(G)I-DLE",
    aliases: ["아이들", "여자아이들"],
    imageUrl: null,
    subscriberCount: 1270,
  },
  {
    id: 10,
    name: "데이식스",
    nameEn: "DAY6",
    aliases: [],
    imageUrl: null,
    subscriberCount: 760,
  },
];
