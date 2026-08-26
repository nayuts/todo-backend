// src/services/auth/auth-service.ts
import { hash, compare } from "bcrypt"; // 🌟 compare を追加インポート
import { User } from "../../models/user";
import { IAuthService } from "./auth-service.interface";
import { IUserRepository } from "../../repositories/user/user-repository.interface";
import { AccessTokenPayload, generateAccessToken } from "../../utils/token";
import { ConflictDataError, NotFoundDataError, SqlError, UnauthorizedError } from "../../utils/error";

export class AuthService implements IAuthService {
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  public async signIn(email: string, password: string): Promise<string | Error> {
    // 1. データベースからメールアドレスでユーザーを探す
    const existingUser = await this.userRepository.getByEmail(email);
    
    // データが見つからなかった場合は「認証エラー」とする
    if (existingUser instanceof NotFoundDataError) {
      return new UnauthorizedError("メールアドレスまたはパスワードが間違っています");
    }
    // その他のDBエラーなどはそのまま返す
    if (existingUser instanceof Error) {
      return existingUser;
    }

    // 2. パスワードの答え合わせ（入力された平文 vs DBのハッシュ）
    const isMatch = await compare(password, existingUser.password);
    if (!isMatch) {
      // ※セキュリティ上、「パスワードが違います」とは言わず「どちらかが間違っている」とぼかします
      return new UnauthorizedError("メールアドレスまたはパスワードが間違っています");
    }

    // 3. 認証成功！JWTに埋め込む荷物（ペイロード）を準備
    const payload: AccessTokenPayload = {
      userId: existingUser.id as number,
      name: existingUser.name,
      email: existingUser.email,
    };

    // 4. 通行証（JWT）を発行して返す！
    const token = generateAccessToken(payload);
    return token;
  }

  // サインアップ（新規登録）
  public async signUp(user: User): Promise<string | Error> {
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
    
    if (result instanceof Error) { 
      return result;
    }
    // return result; // 成功すれば作成されたIDが返る

    // JWTに埋め込む荷物（ペイロード）を準備
    const payload: AccessTokenPayload = {
      userId: result,
      name: user.name,
      email: user.email,
    };
    // 通行証（JWT）を発行して返す！
    const token = generateAccessToken(payload);
    return token;
  }
}
