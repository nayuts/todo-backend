// src/tests/unit/todo/todo-service.test.ts
import { Todo } from "../../../models/todo";
import { ITodoRepository } from "../../../repositories/todo/todo-repository.interface";
import { TodoService } from "../../../services/todo/todo-service";
import { NotFoundDataError } from "../../../utils/error";

// 🌟 ① テスト用の「偽物のRepository（モック）」を作る関数
function createMockTodoRepository(): ITodoRepository {
  return {
    // jest.fn() を使うと、「呼ばれたフリをする偽物の関数」を作れます
    findAll: jest.fn(),
    getByID: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

describe("TodoServiceの単体テスト", () => {

  describe("findAll (全件取得) のテスト", () => {
    it("Repositoryが正常なら、5件のTodoが返ってくること", async () => {
      // 1. 偽物のRepositoryを準備
      const mockRepository = createMockTodoRepository();
      
      // 偽物のfindAllが呼ばれたら、このダミー配列を返すように設定
      const mockTodos: Todo[] = [
        { id: 1, title: "テスト1", description: "詳細1" },
        { id: 2, title: "テスト2", description: "詳細2" },
      ];
      mockRepository.findAll = jest.fn().mockResolvedValue(mockTodos);

      // 2. 偽物のRepositoryをServiceに注入！（DIの真骨頂）
      const service = new TodoService(mockRepository);

      // 3. 実際にServiceのメソッドを実行
      const result = await service.findAll();

      // 4. 結果の検証（アサーション）
      if (result instanceof Error) throw new Error("エラーが発生しました");
      expect(result.length).toBe(2);
      expect(result[0].title).toBe("テスト1");
    });
  });

  describe("getByID (1件取得) のテスト", () => {
    it("指定したIDのTodoが返ってくること", async () => {
      const mockRepository = createMockTodoRepository();
      const mockTodo: Todo = { id: 1, title: "テスト", description: "詳細" };
      
      mockRepository.getByID = jest.fn().mockResolvedValue(mockTodo);

      const service = new TodoService(mockRepository);
      const result = await service.getByID(1);

      if (result instanceof Error) throw new Error("エラーが発生しました");
      expect(result.id).toBe(1);
      expect(result.title).toBe("テスト");
    });

    it("Repositoryでエラーが起きたら、Serviceもエラーを返すこと", async () => {
      const mockRepository = createMockTodoRepository();
      // わざとエラーを返すように設定
      mockRepository.getByID = jest.fn().mockResolvedValue(new Error("見つかりません"));

      const service = new TodoService(mockRepository);
      const result = await service.getByID(99);

      // 結果が Error クラスになっているかを検証
      expect(result instanceof Error).toBeTruthy();
    });
  });

  describe("create (新規作成) のテスト", () => {
    it("正常に作成された場合、新しいIDが返ってくること", async () => {
      const mockRepository = createMockTodoRepository();
      mockRepository.create = jest.fn().mockResolvedValue(1);

      const service = new TodoService(mockRepository);
      const newTodo: Todo = { title: "買い物", description: "牛乳を買う" };
      const result = await service.create(newTodo);

      expect(result).toBe(1);
    });
  });

  //演習課題
  describe("update のテスト", () => {
    it("正常系： エラーが起きず、null や undefined が返ってくること", async () => {
      //モック作成
      const mockRepository = createMockTodoRepository();
      const mockTodo: Todo = { id: 1, title: "テスト", description: "詳細" };

      //todoが存在するか確認...
      mockRepository.getByID = jest.fn().mockResolvedValue(mockTodo);
      //updateをしてundefined
      mockRepository.update = jest.fn().mockResolvedValue(undefined);

      //更新データ作成
      const updateTodo: Todo = { title: "てすてす", description: "詳細詳細" };

      const service = new TodoService(mockRepository);
      const result = await service.update(1, updateTodo);

      expect(result).toBe(undefined);
    });

    it("異常系： getByID でデータが見つからなかった場合、NotFoundDataErrorを返すこと", async () => {
      const mockRepository = createMockTodoRepository();
      // わざとエラーを返すように設定
      mockRepository.getByID = jest.fn().mockResolvedValue(new NotFoundDataError("見つかりません！"));
      
      const updateTodo: Todo = { title: "てすてす", description: "詳細詳細" };
      const service = new TodoService(mockRepository);
      const result = await service.update(1, updateTodo);
      // 結果が NotFoundDataError クラスになっているかを検証
      expect(result instanceof NotFoundDataError).toBeTruthy();
    });
    });

    describe("delete のテスト", () => {
        it("正常系： エラーが起きず、null や undefined が返ってくること。", async () => {
            const mockRepository = createMockTodoRepository();
        
            mockRepository.delete = jest.fn().mockResolvedValue(undefined);

            const service = new TodoService(mockRepository);
            const result = await service.delete(1);

            expect(result).toBe(undefined);
        });
    });
});