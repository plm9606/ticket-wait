import type { PerformanceGenre, PerformanceStatus, TicketSource } from "./enums.js";

export interface Artist {
  id: number;
  name: string;
  nameEn: string | null;
  aliases: string[];
  imageUrl: string | null;
  musicbrainzId: string | null;
  appleMusicId: number | null;
  createdAt: Date;
}

export interface ArtistWithSubscriptionCount extends Artist {
  subscriberCount: number;
}

export interface ArtistWithPerformances extends ArtistWithSubscriptionCount {
  performances: Array<{
    id: number;
    title: string;
    startDate: Date | null;
    endDate: Date | null;
    status: PerformanceStatus;
    genre: PerformanceGenre;
    imageUrl: string | null;
    source: TicketSource;
    sourceUrl: string;
    ticketOpenDate: Date | null;
  }>;
}

export interface ArtistMatchData {
  id: number;
  name: string;
  nameEn: string | null;
  aliases: string[];
}

export interface CreateArtistInput {
  name: string;
  nameEn?: string | null;
  aliases?: string[];
}
