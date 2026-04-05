import type { IPerformanceRepository } from "../../ports/out/performance.port.js";
import type { ISubscriptionRepository } from "../../ports/out/subscription.port.js";
import type { IPerformanceUseCase } from "../../ports/in/performance.use-case.js";
import type {
  CursorPage,
  Performance,
  PerformanceDetail,
  PerformanceFilters,
  PerformanceListItem,
} from "../../domain/performance.entity.js";

export class PerformanceService implements IPerformanceUseCase {
  constructor(
    private performances: IPerformanceRepository,
    private subscriptions: ISubscriptionRepository
  ) {}

  async list(
    filters: PerformanceFilters,
    limit = 20,
    cursor?: number
  ): Promise<CursorPage<PerformanceListItem>> {
    return this.performances.findMany(filters, Math.min(limit, 50), cursor);
  }

  async findById(id: number): Promise<PerformanceDetail> {
    const performance = await this.performances.findById(id);
    if (!performance) {
      throw Object.assign(new Error("Performance not found"), { statusCode: 404 });
    }
    return performance;
  }

  async findByArtist(artistId: number, limit = 20): Promise<Performance[]> {
    return this.performances.findByArtist(artistId, Math.min(limit, 50));
  }

  async feed(
    userId: number,
    limit = 20,
    cursor?: number
  ): Promise<CursorPage<PerformanceListItem>> {
    const artistIds = await this.subscriptions.findArtistIds(userId);
    if (artistIds.length === 0) {
      return { items: [], nextCursor: null };
    }
    return this.performances.findFeed(artistIds, Math.min(limit, 50), cursor);
  }
}
