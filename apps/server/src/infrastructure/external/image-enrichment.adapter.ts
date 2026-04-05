import type { IImageEnrichmentPort, ArtistImageData } from "../../ports/out/image-enrichment.port.js";
import { AppleMusicAdapter } from "./apple-music.adapter.js";
import { WikidataAdapter } from "./wikidata.adapter.js";

export class ImageEnrichmentAdapter implements IImageEnrichmentPort {
  private appleMusic = new AppleMusicAdapter();
  private wikidata = new WikidataAdapter();

  async fetchImageData(artist: {
    name: string;
    nameEn: string | null;
    aliases: string[];
    musicbrainzId: string | null;
  }): Promise<ArtistImageData> {
    let appleMusicId: number | null = null;
    let imageUrl: string | null = null;

    // 1. Apple Music 검색
    try {
      const result = await this.appleMusic.searchArtist(artist.name, artist.nameEn, artist.aliases);
      if (result) {
        appleMusicId = result.appleMusicId;
        imageUrl = await this.appleMusic.scrapeImageUrl(result.artistPageUrl).catch(() => null);
      }
    } catch (e) {
      console.warn(`[ImageEnrichment] Apple Music 검색 실패 (${artist.name}):`, e instanceof Error ? e.message : e);
    }

    // 2. Wikidata fallback (이미지가 없고 musicbrainzId가 있을 때)
    if (!imageUrl && artist.musicbrainzId) {
      try {
        imageUrl = await this.wikidata.getImageUrlByMbid(artist.musicbrainzId);
      } catch (e) {
        console.warn(`[ImageEnrichment] Wikidata 조회 실패 (${artist.name}):`, e instanceof Error ? e.message : e);
      }
    }

    return { appleMusicId, imageUrl };
  }
}
