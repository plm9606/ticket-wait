import type { IArtistRepository } from "../../ports/out/artist.port.js";
import type { IArtistUseCase } from "../../ports/in/artist.use-case.js";
import type {
  ArtistWithPerformances,
  ArtistWithSubscriptionCount,
} from "../../domain/artist.entity.js";

export class ArtistService implements IArtistUseCase {
  constructor(private artists: IArtistRepository) {}

  async search(query: string, limit = 20): Promise<ArtistWithSubscriptionCount[]> {
    if (!query?.trim()) return [];
    return this.artists.search(query.trim(), Math.min(limit, 50));
  }

  async list(limit = 30): Promise<ArtistWithSubscriptionCount[]> {
    return this.artists.findAll(Math.min(limit, 50));
  }

  async findById(id: number): Promise<ArtistWithPerformances> {
    const artist = await this.artists.findById(id);
    if (!artist) {
      throw Object.assign(new Error("Artist not found"), { statusCode: 404 });
    }
    return artist;
  }
}
