import axios from "axios";
import type { IWikidataPort } from "../../ports/out/wikidata.port.js";
import type { IMusicBrainzPort } from "../../ports/out/musicbrainz.port.js";

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const COMMONS_FILE_PATH = "https://commons.wikimedia.org/wiki/Special:FilePath";
// Wikimedia API는 User-Agent 미설정 시 403 반환
const USER_AGENT = "ConcertAlert/1.0 (https://github.com/concert-alert)";

// Wikidata API 응답 타입 (필요한 부분만)
interface WikidataEntity {
  claims?: {
    P18?: Array<{
      mainsnak: {
        snaktype: string;
        datavalue?: { value: unknown };
      };
    }>;
  };
}

interface WikidataResponse {
  entities: Record<string, WikidataEntity>;
}

export class WikidataAdapter implements IWikidataPort {
  constructor(private musicbrainz: IMusicBrainzPort) {}

  // Wikidata Q ID → Wikimedia Commons 이미지 URL (P18 property)
  async getImageUrl(wikidataId: string): Promise<string | null> {
    const { data } = await axios.get<WikidataResponse>(WIKIDATA_API, {
      params: { action: "wbgetentities", ids: wikidataId, props: "claims", format: "json" },
      headers: { "User-Agent": USER_AGENT },
      timeout: 10000,
    });

    const p18 = data.entities?.[wikidataId]?.claims?.P18;
    if (!p18?.length) return null;

    const filename = p18[0]?.mainsnak?.datavalue?.value;
    if (!filename || typeof filename !== "string") return null;

    return `${COMMONS_FILE_PATH}/${encodeURIComponent(filename)}`;
  }

  // MBID → MusicBrainz url-rels → Wikidata ID → Commons 이미지 URL
  async getImageUrlByMbid(mbid: string): Promise<string | null> {
    const wikidataId = await this.musicbrainz.getArtistWikidataId(mbid);
    if (!wikidataId) return null;
    return this.getImageUrl(wikidataId);
  }
}
