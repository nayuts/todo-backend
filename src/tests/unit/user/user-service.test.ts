// src/tests/unit/user/user-service.test.ts
import { UserService } from "../../../services/user/user-service";
import { User } from "../../../models/user";
import { IUserRepository } from "../../../repositories/user/user-repository.interface";
import { NotFoundDataError } from "../../../utils/error";

// UserRepositoryの「偽物」を作る関数
function createMockUserRepository(): jest.Mocked<IUserRepository> {
  return {
    create: jest.fn(),
    getByEmail: jest.fn(),
    getByID: jest.fn(), // 🌟 今回使うメソッドのモック
  };
}

describe("UserService のユニットテスト", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getProfile (プロフィール取得)", () => {
    it("存在するIDの場合、パスワードが除外されたユーザー情報が返ること", async () => {
      // 🌟 準備 (Arrange)
      const mockUserRepository = createMockUserRepository();
      const userService = new UserService(mockUserRepository);
      
      const dbUser: User = { 
        id: 1, 
        name: "テストユーザー", 
        email: "test@example.com", 
        password: "secret_password" // DBにはパスワードが入っている
      };
      
      // Repositoryはパスワード入りのデータを返すと偽装する
      mockUserRepository.getByID.mockResolvedValue(dbUser);

      // 🌟 実行 (Act)
      const result = await userService.getProfile(1);

      // 🌟 確認 (Assert)
      expect(result).not.toBeInstanceOf(Error);
      
      // 1. エラーでないことをTypeScriptに教えるためのキャスト
      const profile = result as Omit<User, "password">;
      
      // 2. 名前やメールアドレスは正しく取得できているか
      expect(profile.name).toBe("テストユーザー");
      expect(profile.email).toBe("test@example.com");
      
      // 🚨 3. 超重要：パスワードが含まれて「いない」ことを証明する！
      expect((profile as any).password).toBeUndefined();
    });

    it("存在しないIDの場合、NotFoundDataErrorが返ること", async () => {
      // 🌟 準備 (Arrange)
      const mockUserRepository = createMockUserRepository();
      const userService = new UserService(mockUserRepository);
      
      mockUserRepository.getByID.mockResolvedValue(new NotFoundDataError("見つかりません"));

      // 🌟 実行 (Act)
      const result = await userService.getProfile(999);

      // 🌟 確認 (Assert)
      expect(result).toBeInstanceOf(NotFoundDataError);
    });
  });
});
