// src/tests/unit/todo/todo-repository.test.ts
import { Todo } from "../../../models/todo";
import { TodoRepository } from "../../../repositories/todo/todo-repository";
import { NotFoundDataError } from "../../../utils/error";
import { createDBConnection } from "../../utils/database/database"; // 🌟 共通化した接続ツール

// 🌟 database.tsのおかげで、たった1行で接続準備が完了します！
const prisma = createDBConnection();

beforeEach(async () => {
  // 🌟 生SQLを書かずに、テーブルの中身を一括削除！
  await prisma.todo.deleteMany();
});

// 🌟 afterEach ではなく afterAll に変更！（プールの破壊を防ぐため）
afterAll(async () => {
  // すべてのテストが終わった後に、データベースとの接続を切断する
  await prisma.$disconnect();
});

describe("TodoRepositoryのテスト", () => {
  describe("create (新規作成) のテスト", () => {
    it("データベースに正しく保存され、新しいIDが返ってくること", async () => {
      const repository = new TodoRepository(prisma); // prismaを渡す
      const newTodo: Todo = { title: "テスト用タイトル", description: "テスト用詳細" };

      const result = await repository.create(newTodo);

      if (result instanceof Error) throw new Error("エラーが発生しました");
      const createdID = result;

      // 🌟 生SQLではなく、Prismaを使って実際に保存されたか確認する！
      const savedTodo = await prisma.todo.findUnique({
        where: { id: createdID },
      });

      expect(savedTodo).not.toBeNull();
      expect(savedTodo?.id).toBe(createdID);
      expect(savedTodo?.title).toBe(newTodo.title);
      expect(savedTodo?.description).toBe(newTodo.description);
    });
  });

  describe("findAll (全件取得) のテスト", () => {
    it("保存されているすべてのTodoが取得できること", async () => {
      // 🌟 生SQLのINSERT文を何行も書く代わりに、createManyで一気に作成！
      await prisma.todo.createMany({
        data: [
          { title: "ダミー1", description: "詳細1" },
          { title: "ダミー2", description: "詳細2" },
        ],
      });

      const repository = new TodoRepository(prisma);
      const result = await repository.findAll();

      if (result instanceof Error) throw new Error("エラーが発生しました");
      expect(result.length).toBe(2);
      expect(result[0].title).toBe("ダミー1");
    });
  });

  describe("getByID (1件取得) のテスト", () => {
    it("指定したIDのTodoが取得できること", async () => {
      // 🌟 Prismaで1件テストデータを作成し、そのIDを取得
      const created = await prisma.todo.create({
        data: { title: "対象のTodo", description: "対象の詳細" },
      });

      const repository = new TodoRepository(prisma);
      const result = await repository.getByID(created.id);

      if (result instanceof Error) throw new Error("エラーが発生しました");
      expect(result.id).toBe(created.id);
      expect(result.title).toBe("対象のTodo");
    });

    it("存在しないIDを指定した場合、NotFoundDataError が返ること", async () => {
      const repository = new TodoRepository(prisma);
      const result = await repository.getByID(999);
      expect(result instanceof NotFoundDataError).toBeTruthy();
    });
  });

  describe("update (更新) のテスト", () => {
    it("正常に更新され、データベースの値が書き換わっていること", async () => {
      // 1. Prismaで古いデータを作成
      const created = await prisma.todo.create({
        data: { title: "古いタイトル", description: "古い詳細" },
      });

      const repository = new TodoRepository(prisma);
      const updateData: Todo = { title: "新しいタイトル", description: "新しい詳細" };

      // 2. 実行
      const result = await repository.update(created.id, updateData);
      if (result instanceof Error) throw new Error("エラーが発生しました");

      // 3. 確認：Prismaで取得し直して値が書き換わっているか検証
      const savedTodo = await prisma.todo.findUnique({
        where: { id: created.id },
      });

      expect(savedTodo?.title).toBe(updateData.title);
      expect(savedTodo?.description).toBe(updateData.description);
    });
  });

  describe("delete (削除) のテスト", () => {
    it("正常に削除され、データベースからデータが消えていること", async () => {
      // 1. Prismaで削除用のデータを作成
      const created = await prisma.todo.create({
        data: { title: "削除されるTodo", description: "詳細" },
      });

      const repository = new TodoRepository(prisma);

      // 2. 実行
      const result = await repository.delete(created.id);
      if (result instanceof Error) throw new Error("エラーが発生しました");

      // 3. 確認：Prismaで検索をかけてみる
      const savedTodo = await prisma.todo.findUnique({
        where: { id: created.id },
      });

      // 🌟 PrismaのfindUniqueは見つからない場合 null を返すので、それを検証！
      expect(savedTodo).toBeNull();
    });
  });
});
