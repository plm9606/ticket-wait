export type TicketSource = "MELON" | "YES24" | "INTERPARK";
export type PerformanceStatus =
  | "UPCOMING"
  | "ON_SALE"
  | "SOLD_OUT"
  | "COMPLETED"
  | "CANCELLED";

export type PerformanceGenre =
  | "CONCERT"
  | "FESTIVAL"
  | "FANMEETING"
  | "MUSICAL"
  | "CLASSIC"
  | "HIPHOP"
  | "TROT"
  | "OTHER";

export interface Venue {
  id: number;
  name: string;
  kopisId: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  seatScale: number | null;
  phone: string | null;
  website: string | null;
  sido: string | null;
  gugun: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Performance {
  id: number;
  title: string;
  artistId: number | null;
  venueId: number | null;
  startDate: Date | null;
  endDate: Date | null;
  ticketOpenDate: Date | null;
  source: TicketSource;
  sourceId: string;
  sourceUrl: string;
  imageUrl: string | null;
  rawTitle: string;
  kopisId: string | null;
  genre: PerformanceGenre;
  status: PerformanceStatus;
  createdAt: Date;
  updatedAt: Date;
}
