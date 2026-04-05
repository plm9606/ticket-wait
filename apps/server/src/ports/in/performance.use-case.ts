import type {
  CursorPage,
  Performance,
  PerformanceDetail,
  PerformanceFilters,
  PerformanceListItem,
} from "../../domain/performance.entity.js";

export interface IPerformanceUseCase {
  list(filters: PerformanceFilters, limit?: number, cursor?: number): Promise<CursorPage<PerformanceListItem>>;
  findById(id: number): Promise<PerformanceDetail>;
  findByArtist(artistId: number, limit?: number): Promise<Performance[]>;
  feed(userId: number, limit?: number, cursor?: number): Promise<CursorPage<PerformanceListItem>>;
}
