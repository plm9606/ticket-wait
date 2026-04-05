import axios from "axios";
import { env } from "../../config/env.js";
import type { IKakaoAuthPort, KakaoUserProfile } from "../../ports/out/kakao-auth.port.js";

const KAKAO_AUTH_URL = "https://kauth.kakao.com";
const KAKAO_API_URL = "https://kapi.kakao.com";

interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
}

interface KakaoProfile {
  id: number;
  kakao_account?: {
    email?: string;
    profile?: {
      nickname?: string;
      profile_image_url?: string;
    };
  };
}

export class KakaoAdapter implements IKakaoAuthPort {
  getAuthorizationUrl(redirectUri?: string): string {
    const params = new URLSearchParams({
      client_id: env.KAKAO_REST_API_KEY,
      redirect_uri: redirectUri || env.KAKAO_REDIRECT_URI,
      response_type: "code",
    });
    return `${KAKAO_AUTH_URL}/oauth/authorize?${params}`;
  }

  async exchangeCode(
    code: string,
    redirectUri?: string
  ): Promise<{ access_token: string }> {
    const { data } = await axios.post<KakaoTokenResponse>(
      `${KAKAO_AUTH_URL}/oauth/token`,
      new URLSearchParams({
        grant_type: "authorization_code",
        client_id: env.KAKAO_REST_API_KEY,
        client_secret: env.KAKAO_CLIENT_SECRET,
        redirect_uri: redirectUri || env.KAKAO_REDIRECT_URI,
        code,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    return data;
  }

  async getUserProfile(accessToken: string): Promise<KakaoUserProfile> {
    const { data } = await axios.get<KakaoProfile>(
      `${KAKAO_API_URL}/v2/user/me`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    return {
      kakaoId: String(data.id),
      nickname: data.kakao_account?.profile?.nickname || `user_${data.id}`,
      email: data.kakao_account?.email || null,
      profileImage: data.kakao_account?.profile?.profile_image_url || null,
    };
  }
}
