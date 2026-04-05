import type { IEnrichArtistUseCase, EnrichResult } from "../../ports/in/enrich-artist.use-case.js";
import type { IArtistRepository } from "../../ports/out/artist.port.js";
import type { IImageEnrichmentPort } from "../../ports/out/image-enrichment.port.js";

export class EnrichArtistService implements IEnrichArtistUseCase {
  constructor(
    private artists: IArtistRepository,
    private imageEnrichment: IImageEnrichmentPort
  ) {}

  async enrichOne(artistId: number): Promise<void> {
    const artist = await this.artists.findById(artistId);
    if (!artist) return;

    try {
      const data = await this.imageEnrichment.fetchImageData(artist);
      if (data.appleMusicId !== null || data.imageUrl !== null) {
        await this.artists.update(artistId, data);
        console.log(`[Enrich] ${artist.name}: ${data.imageUrl ? "이미지 저장" : "appleMusicId만 저장"}`);
      } else {
        console.log(`[Enrich] ${artist.name}: 이미지 없음`);
      }
    } catch (e) {
      console.error(`[Enrich] ${artist.name} 실패:`, e instanceof Error ? e.message : e);
    }
  }

  async enrichAll(): Promise<EnrichResult> {
    const artists = await this.artists.findAllWithoutImage();
    console.log(`[Enrich] 이미지 없는 아티스트 ${artists.length}명`);

    let enriched = 0;
    for (let i = 0; i < artists.length; i++) {
      const artist = artists[i];
      console.log(`[Enrich] [${i + 1}/${artists.length}] ${artist.name} 처리 중...`);

      try {
        const data = await this.imageEnrichment.fetchImageData(artist);
        if (data.appleMusicId !== null || data.imageUrl !== null) {
          await this.artists.update(artist.id, data);
          enriched++;
          console.log(`[Enrich]   완료: ${data.imageUrl ? "이미지 저장" : "appleMusicId만 저장"}`);
        } else {
          console.log(`[Enrich]   이미지 없음`);
        }
      } catch (e) {
        console.error(`[Enrich]   실패:`, e instanceof Error ? e.message : e);
      }
    }

    return { processed: artists.length, enriched };
  }
}
