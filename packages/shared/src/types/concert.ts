export type TicketSource = "MELON" | "YES24" | "INTERPARK";
export type ConcertStatus =
  | "UPCOMING"
  | "ON_SALE"
  | "SOLD_OUT"
  | "COMPLETED"
  | "CANCELLED";

export interface Concert {
  id: string;
  title: string;
  artistId: string | null;
  venue: string | null;
  startDate: Date | null;
  endDate: Date | null;
  ticketOpenDate: Date | null;
  source: TicketSource;
  sourceId: string;
  sourceUrl: string;
  imageUrl: string | null;
  rawTitle: string;
  status: ConcertStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface RawConcertData {
  title: string;
  venue?: string;
  startDate?: string;
  endDate?: string;
  ticketOpenDate?: string;
  sourceId: string;
  sourceUrl: string;
  imageUrl?: string;
}
