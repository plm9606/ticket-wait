export interface AppleMusicArtist {
  appleMusicId: number;
  name: string;
  artistPageUrl: string;
}

export interface IAppleMusicPort {
  searchArtist(
    name: string,
    nameEn: string | null,
    aliases: string[]
  ): Promise<AppleMusicArtist | null>;
  scrapeImageUrl(artistPageUrl: string): Promise<string | null>;
}
