export interface IWikidataPort {
  getImageUrl(wikidataId: string): Promise<string | null>;
  getImageUrlByMbid(mbid: string): Promise<string | null>;
}
