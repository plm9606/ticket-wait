import type { UpsertUserInput, User, UserWithFcmTokens } from "../../domain/user.entity.js";

export interface IUserRepository {
  upsert(data: UpsertUserInput): Promise<User>;
  findById(id: number): Promise<User | null>;
  findSubscribersByArtist(artistId: number): Promise<UserWithFcmTokens[]>;
}
