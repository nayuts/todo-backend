// src/tests/unit/auth/auth-service.test.ts
import { AuthService } from "../../../services/auth/auth-service";
import { User } from "../../../models/user";
import { IUserRepository } from "../../../repositories/user/user-repository.interface";
import { NotFoundDataError, UnauthorizedError, ConflictDataError } from "../../../utils/error";
import * as bcrypt from "bcrypt";
import * as tokenUtils from "../../../utils/token";

// 🌟 外部ライブラリをモック（偽造）する
jest.mock("bcrypt");
jest.mock("../../../utils/token");

// 🌟 UserRepositoryの「偽物」を作る関数
function createMockUserRepository(): jest.Mocked<IUserRepository> {
  return {
    create: jest.fn(),
    getByEmail: jest.fn(),
  };
}

describe("AuthService のユニットテスト", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // テストごとにモックの履歴をリセット
  });

  describe("signUp (新規登録)", () => {
    it("未登録のメールの場合、ハッシュ化されて保存され、トークンが返ること", async () => {
      // 🌟 準備 (Arrange)
      const mockUserRepository = createMockUserRepository();
      const authService = new AuthService(mockUserRepository);
      const newUser: User = { name: "テスト", email: "test@example.com", password: "plain_password" };
      
      // モックの振る舞いを設定
      mockUserRepository.getByEmail.mockResolvedValue(new NotFoundDataError("見つかりません")); // 未登録
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed_password"); // ハッシュ化の偽結果
      mockUserRepository.create.mockResolvedValue(1); // ID: 1が作られたことにする
      (tokenUtils.generateAccessToken as jest.Mock).mockReturnValue("mock_token"); // トークンの偽結果

      // 🌟 実行 (Act)
      const result = await authService.signUp(newUser);

      // 🌟 確認 (Assert)
      expect(result).toBe("mock_token");
      // ちゃんと「ハッシュ化されたパスワード」でDB保存を指示したか確認！
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...newUser,
        password: "hashed_password"
      });
    });

    it("既に登録済みのメールアドレスの場合、ConflictDataErrorが返ること", async () => {
      // 🌟 準備 (Arrange)
      const mockUserRepository = createMockUserRepository();
      const authService = new AuthService(mockUserRepository);
      const newUser: User = { name: "テスト", email: "exist@example.com", password: "plain_password" };
      
      // 既にユーザーが存在すると偽装
      mockUserRepository.getByEmail.mockResolvedValue({ id: 1, ...newUser });

      // 🌟 実行 (Act)
      const result = await authService.signUp(newUser);

      // 🌟 確認 (Assert)
      expect(result).toBeInstanceOf(ConflictDataError);
      expect(mockUserRepository.create).not.toHaveBeenCalled(); // 保存処理が呼ばれていないことを証明
    });
  });

  describe("signIn (ログイン)", () => {
    it("正しいメールとパスワードの場合、トークンが返ること", async () => {
      // 🌟 準備 (Arrange)
      const mockUserRepository = createMockUserRepository();
      const authService = new AuthService(mockUserRepository);
      const dbUser: User = { id: 1, name: "テスト", email: "test@example.com", password: "hashed_password" };
      
      mockUserRepository.getByEmail.mockResolvedValue(dbUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true); // 🌟 パスワード一致！と偽装
      (tokenUtils.generateAccessToken as jest.Mock).mockReturnValue("mock_token");

      // 🌟 実行 (Act)
      const result = await authService.signIn("test@example.com", "plain_password");
      
      // 🌟 確認 (Assert)
      expect(result).toBe("mock_token");
    });

    it("パスワードが間違っている場合、UnauthorizedErrorが返ること", async () => {
      // 🌟 準備 (Arrange)
      const mockUserRepository = createMockUserRepository();
      const authService = new AuthService(mockUserRepository);
      const dbUser: User = { id: 1, name: "テスト", email: "test@example.com", password: "hashed_password" };
      
      mockUserRepository.getByEmail.mockResolvedValue(dbUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false); // 🌟 パスワード不一致！と偽装

      // 🌟 実行 (Act)
      const result = await authService.signIn("test@example.com", "wrong_password");
      
      // 🌟 確認 (Assert)
      expect(result).toBeInstanceOf(UnauthorizedError);
    });
  });
});
