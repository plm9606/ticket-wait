import type {
  ArtistWithPerformances,
  ArtistWithSubscriptionCount,
} from "../../domain/artist.entity.js";

export interface IArtistUseCase {
  search(query: string, limit?: number): Promise<ArtistWithSubscriptionCount[]>;
  list(limit?: number): Promise<ArtistWithSubscriptionCount[]>;
  findById(id: number): Promise<ArtistWithPerformances>;
}
