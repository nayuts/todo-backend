// src/services/user/user-service.ts
import { IUserService } from "./user-service.interface";
import { IUserRepository } from "../../repositories/user/user-repository.interface";

export class UserService implements IUserService {
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  public async getProfile(userId: number) {
    // 1. Repositoryを使ってDBからユーザーを取得
    const user = await this.userRepository.getByID(userId);
    
    if (user instanceof Error) {
      return user; // エラーならそのまま返す
    }

    // 🌟 2. 超重要：パスワードを除外する（分割代入というテクニックを使います）
    const { password, ...safeProfile } = user;

    // 3. パスワードが含まれていない安全なプロフィールだけを返す
    return safeProfile;
  }
}
