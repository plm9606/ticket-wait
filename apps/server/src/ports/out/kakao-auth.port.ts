export interface KakaoUserProfile {
  kakaoId: string;
  nickname: string;
  email: string | null;
  profileImage: string | null;
}

export interface IKakaoAuthPort {
  getAuthorizationUrl(redirectUri?: string): string;
  exchangeCode(code: string, redirectUri?: string): Promise<{ access_token: string }>;
  getUserProfile(accessToken: string): Promise<KakaoUserProfile>;
}
