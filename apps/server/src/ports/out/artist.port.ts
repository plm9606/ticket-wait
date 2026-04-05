import type {
  Artist,
  ArtistMatchData,
  ArtistWithPerformances,
  ArtistWithSubscriptionCount,
  CreateArtistInput,
} from "../../domain/artist.entity.js";

export interface IArtistRepository {
  search(query: string, limit: number): Promise<ArtistWithSubscriptionCount[]>;
  findAll(limit: number): Promise<ArtistWithSubscriptionCount[]>;
  findById(id: number): Promise<ArtistWithPerformances | null>;
  findAllForMatching(): Promise<ArtistMatchData[]>;
  create(data: CreateArtistInput): Promise<Artist>;
}
