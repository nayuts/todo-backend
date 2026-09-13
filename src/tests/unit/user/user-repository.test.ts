// src/tests/unit/user/user-repository.test.ts
import { UserRepository } from "../../../repositories/user/user-repository";
import { User } from "../../../models/user";
import { NotFoundDataError } from "../../../utils/error";
import { createDBConnection } from "../../utils/database/database";

const prisma = createDBConnection();

describe("UserRepository のユニットテスト", () => {
  beforeEach(async () => {
    // 外部キー制約を避けるため、Todo -> User の順に削除
    await prisma.todo.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("create (ユーザー作成)", () => {
    it("新しいユーザーが保存され、IDが返ってくること", async () => {
      // 🌟 準備 (Arrange)
      const repository = new UserRepository(prisma);
      const newUser: User = { name: "テスト", email: "test@example.com", password: "hashed_password" };
      
      // 🌟 実行 (Act)
      const result = await repository.create(newUser);
      
      // 🌟 確認 (Assert)
      expect(typeof result).toBe("number");
      // 実際にDBに保存されたか確認
      const saved = await prisma.user.findUnique({ where: { id: result as number } });
      expect(saved?.email).toBe(newUser.email);
    });
  });

  describe("getByID (IDで取得)", () => {
    it("存在するIDの場合、ユーザー情報が返ってくること", async () => {
      // 🌟 準備 (Arrange)
      const repository = new UserRepository(prisma);
      const newUser: User = { name: "テスト", email: "test3@example.com", password: "hashed_password" };
      const createdId = await repository.create(newUser);

      // 🌟 実行 (Act)
      const result = await repository.getByID(createdId as number);

      // 🌟 確認 (Assert)
      expect(result).not.toBeInstanceOf(Error);
      expect((result as User).name).toBe("テスト");
    });

    it("存在しないIDの場合、NotFoundDataErrorが返ること", async () => {
      // 🌟 準備 (Arrange)
      const repository = new UserRepository(prisma);

      // 🌟 実行 (Act)
      const result = await repository.getByID(999999);

      // 🌟 確認 (Assert)
      expect(result).toBeInstanceOf(NotFoundDataError);
    });
  });

  describe("getByEmail (メールアドレスで取得)", () => {
    it("存在するメールアドレスの場合、ユーザー情報が返ってくること", async () => {
      // 🌟 準備 (Arrange)
      const repository = new UserRepository(prisma);
      const newUser: User = { name: "テスト", email: "test2@example.com", password: "hashed_password" };
      await repository.create(newUser);

      // 🌟 実行 (Act)
      const result = await repository.getByEmail("test2@example.com");
      
      // 🌟 確認 (Assert)
      expect(result).not.toBeInstanceOf(Error);
      expect((result as User).name).toBe("テスト");
    });

    it("存在しないメールアドレスの場合、NotFoundDataErrorが返ること", async () => {
      // 🌟 準備 (Arrange)
      const repository = new UserRepository(prisma);
      
      // 🌟 実行 (Act)
      const result = await repository.getByEmail("notfound@example.com");
      
      // 🌟 確認 (Assert)
      expect(result).toBeInstanceOf(NotFoundDataError);
    });
  });
});
