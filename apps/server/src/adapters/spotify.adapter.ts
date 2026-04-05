import axios, { type AxiosInstance, isAxiosError } from "axios";
import type { components } from "../generated/spotify.js";
import type { ArtistImagePort, ArtistSearchResult } from "../ports/artist-image.port.js";

type ArtistObject = components["schemas"]["ArtistObject"];
type ImageObject = components["schemas"]["ImageObject"];

// ─── Token 관리 ────────────────────────────────────────────────────────────────

interface TokenCache {
  accessToken: string;
  expiresAt: number; // unix ms
}

// ─── Image 캐시 (Spotify ToS: immediate use 목적의 단기 캐싱만 허용) ───────────

interface ImageCache {
  imageUrl: string | null;
  expiresAt: number; // unix ms
}

const IMAGE_CACHE_TTL_MS = 60 * 60 * 1000; // 1시간
const TOKEN_REFRESH_BUFFER_MS = 60 * 1000; // 만료 60초 전 갱신

export class SpotifyAdapter implements ArtistImagePort {
  private client: AxiosInstance;
  private tokenCache: TokenCache | null = null;
  private imageCache = new Map<string, ImageCache>();

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string
  ) {
    this.client = axios.create({
      baseURL: "https://api.spotify.com/v1",
      timeout: 10000,
    });
  }

  // ─── 토큰 관리 ────────────────────────────────────────────────────────────

  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.tokenCache && this.tokenCache.expiresAt - TOKEN_REFRESH_BUFFER_MS > now) {
      return this.tokenCache.accessToken;
    }

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
    const { data } = await axios.post<{ access_token: string; expires_in: number }>(
      "https://accounts.spotify.com/api/token",
      "grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    this.tokenCache = {
      accessToken: data.access_token,
      expiresAt: now + data.expires_in * 1000,
    };

    return this.tokenCache.accessToken;
  }

  // ─── Rate limit 처리 (exponential backoff, 최대 3회) ──────────────────────

  private async requestWithRetry<T>(fn: () => Promise<T>, attempt = 0): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (isAxiosError(err) && err.response) {
        const status = err.response.status;

        if (status === 401 && attempt === 0) {
          // 토큰 만료 → 강제 갱신 후 1회 재시도
          this.tokenCache = null;
          return this.requestWithRetry(fn, attempt + 1);
        }

        if (status === 429 && attempt < 3) {
          const retryAfter = Number(err.response.headers["retry-after"] ?? 1);
          const backoff = retryAfter * 1000 * Math.pow(2, attempt);
          await new Promise((r) => setTimeout(r, backoff));
          return this.requestWithRetry(fn, attempt + 1);
        }

        throw new Error(
          `Spotify API error: ${status} ${err.response.data?.error?.message ?? err.message}`
        );
      }
      throw err;
    }
  }

  // ─── 이미지 선택 (widest first → 가장 큰 이미지 사용) ──────────────────────

  private pickImage(images: ImageObject[] | undefined): string | null {
    if (!images || images.length === 0) return null;
    return images[0].url ?? null;
  }

  // ─── ArtistImagePort 구현 ─────────────────────────────────────────────────

  async getImageUrl(spotifyId: string): Promise<string | null> {
    const now = Date.now();
    const cached = this.imageCache.get(spotifyId);
    if (cached && cached.expiresAt > now) {
      return cached.imageUrl;
    }

    const token = await this.getAccessToken();
    const artist = await this.requestWithRetry<ArtistObject>(() =>
      this.client
        .get<ArtistObject>(`/artists/${spotifyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((r) => r.data)
    );

    const imageUrl = this.pickImage(artist.images);
    this.imageCache.set(spotifyId, { imageUrl, expiresAt: now + IMAGE_CACHE_TTL_MS });
    return imageUrl;
  }

  async searchArtist(name: string): Promise<ArtistSearchResult[]> {
    const token = await this.getAccessToken();
    const data = await this.requestWithRetry<{ artists?: { items?: ArtistObject[] } }>(() =>
      this.client
        .get<{ artists?: { items?: ArtistObject[] } }>("/search", {
          headers: { Authorization: `Bearer ${token}` },
          params: { q: name, type: "artist", limit: 5 },
        })
        .then((r) => r.data)
    );

    const items = data.artists?.items ?? [];
    return items
      .filter((a): a is ArtistObject & { id: string; name: string } => !!a.id && !!a.name)
      .map((a) => ({
        spotifyId: a.id,
        name: a.name,
        imageUrl: this.pickImage(a.images),
      }));
  }
}
