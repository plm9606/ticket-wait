import type { PerformanceGenre, PerformanceStatus, TicketSource } from "./enums.js";

export interface Performance {
  id: number;
  title: string;
  rawTitle: string;
  kopisId: string | null;
  venueId: number | null;
  startDate: Date | null;
  endDate: Date | null;
  ticketOpenDate: Date | null;
  source: TicketSource;
  sourceId: string;
  sourceUrl: string;
  imageUrl: string | null;
  genre: PerformanceGenre;
  status: PerformanceStatus;
  createdAt: Date;
}

export interface PerformanceListItem extends Performance {
  artists: Array<{ id: number; name: string; nameEn: string | null }>;
  venue: { id: number; name: string } | null;
}

export interface PerformanceDetail extends Performance {
  artists: Array<{
    id: number;
    name: string;
    nameEn: string | null;
    imageUrl: string | null;
    aliases: string[];
    subscriberCount: number;
  }>;
  venue: {
    id: number;
    name: string;
    address: string | null;
    lat: number | null;
    lng: number | null;
    sido: string | null;
    gugun: string | null;
  } | null;
}

export interface PerformanceFilters {
  source?: TicketSource;
  status?: PerformanceStatus;
  genre?: PerformanceGenre;
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: number | null;
}

export interface UpsertPerformanceInput {
  title: string;
  rawTitle: string;
  kopisId: string;
  source: TicketSource;
  sourceId: string;
  sourceUrl: string;
  artistIds: number[];
  venueId: number | null;
  startDate: Date | null;
  endDate: Date | null;
  imageUrl: string | null;
  genre: PerformanceGenre;
  status: PerformanceStatus;
}
