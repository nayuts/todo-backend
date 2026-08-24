// src/services/auth/auth-service.ts
import { hash } from "bcrypt"; // 🌟 bcryptをインポート
import { User } from "../../models/user";
import { IAuthService } from "./auth-service.interface";
import { IUserRepository } from "../../repositories/user/user-repository.interface";

import { ConflictDataError, SqlError  } from "../../utils/error";

export class AuthService implements IAuthService {
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  // サインアップ（新規登録）
  public async signUp(user: User): Promise<number | Error> {
    // RepositoryのgetByEmailでメールアドレスでユーザーを探す
    const existingUser = await this.userRepository.getByEmail(user.email);
    // Userが返ってきた = もう登録されている
    if (!(existingUser instanceof Error)) {
      return new ConflictDataError("このメールアドレスは既に登録されています");
    }
    // SqlErrorになったら返して中止
    if (existingUser instanceof SqlError) {
      return existingUser;
    }

    // 🌟 1. 受け取ったパスワードをミキサーにかける（ハッシュ化）
    // 第二引数の「10」は、ハッシュ化の複雑さ（コスト）を表します
    const hashedPassword = await hash(user.password, 10);
    
    // 🌟 2. 平文のパスワードを、ハッシュ化されたものに上書きする！
    user.password = hashedPassword;

    // 🌟 3. 上書きされた安全なデータを、Repository（DB）に渡す
    const result = await this.userRepository.create(user);
    
    return result; // 成功すれば作成されたIDが返る
  }
}
