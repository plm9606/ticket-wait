import type {
  CursorPage,
  Performance,
  PerformanceDetail,
  PerformanceFilters,
  PerformanceListItem,
  UpsertPerformanceInput,
} from "../../domain/performance.entity.js";

export interface IPerformanceRepository {
  findMany(
    filters: PerformanceFilters,
    limit: number,
    cursor?: number
  ): Promise<CursorPage<PerformanceListItem>>;
  findById(id: number): Promise<PerformanceDetail | null>;
  findByArtist(artistId: number, limit: number): Promise<Performance[]>;
  findFeed(
    artistIds: number[],
    limit: number,
    cursor?: number
  ): Promise<CursorPage<PerformanceListItem>>;
  upsert(data: UpsertPerformanceInput): Promise<{ performance: Performance; isNew: boolean }>;
  findUnmatched(): Promise<Array<{ id: number; title: string }>>;
  setArtists(id: number, artistIds: number[]): Promise<void>;
  findWithTicketOpenToday(): Promise<
    Array<{
      id: number;
      title: string;
      artistIds: number[];
      artists: Array<{ id: number; name: string }>;
      imageUrl: string | null;
      sourceUrl: string;
    }>
  >;
}
