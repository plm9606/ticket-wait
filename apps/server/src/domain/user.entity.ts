export interface User {
  id: number;
  kakaoId: string;
  nickname: string;
  email: string | null;
  profileImage: string | null;
  createdAt: Date;
}

export interface UpsertUserInput {
  kakaoId: string;
  nickname: string;
  email: string | null;
  profileImage: string | null;
}

export interface UserWithFcmTokens extends User {
  fcmTokens: Array<{ token: string }>;
}
