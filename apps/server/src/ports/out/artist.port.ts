import type {
  Artist,
  ArtistMatchData,
  ArtistWithPerformances,
  ArtistWithSubscriptionCount,
  CreateArtistInput,
  UpdateArtistInput,
} from "../../domain/artist.entity.js";

export interface IArtistRepository {
  search(query: string, limit: number): Promise<ArtistWithSubscriptionCount[]>;
  findAll(limit: number): Promise<ArtistWithSubscriptionCount[]>;
  findById(id: number): Promise<ArtistWithPerformances | null>;
  findAllForMatching(): Promise<ArtistMatchData[]>;
  findAllWithoutImage(): Promise<Artist[]>;
  findByName(name: string): Promise<Artist | null>;
  create(data: CreateArtistInput): Promise<Artist>;
  update(id: number, data: UpdateArtistInput): Promise<void>;
}
