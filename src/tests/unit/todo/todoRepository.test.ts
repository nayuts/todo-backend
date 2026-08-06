// src/tests/unit/todo/todo-repository.test.ts
import { Connection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { Todo } from "../../../models/todo";
import { TodoRepository } from "../../../repositories/todo/todo-repository";
import { createDBConnection } from "../../utils/database/database";
import { NotFoundDataError, SqlError } from "../../../utils/error";

let connection: Connection;

// 🌟 各テストの「前」に毎回必ず実行される処理
beforeEach(async () => {
  connection = await createDBConnection();
  // テスト環境をクリーンにするため、毎回テーブルを空っぽ（初期状態）にする！
  await connection.query(`DELETE FROM todos`);
});

// 🌟 各テストの「後」に毎回必ず実行される処理
afterEach(async () => {
  // データベースとの接続を切断する
  await connection.end();
  // スパイ（モック）の解除忘れを防ぐための後片付け
  jest.restoreAllMocks();
});

describe("TodoRepositoryのテスト", () => {
  describe("create (新規作成) のテスト", () => {
    it("正常系：データベースに正しく保存され、新しいIDが返ってくること", async () => {
      const repository = new TodoRepository(connection);
      const newTodo: Todo = { title: "テスト用タイトル", description: "テスト用詳細" };

      // 実行
      const result = await repository.create(newTodo);
      if (result instanceof Error) throw new Error(`エラーが発生しました: ${result.message}`);
      const createdID = result;

      // 確認（実際にデータベースに保存されたか、生SQLで直接覗きに行って確認する！）
      const checkSql = "SELECT * FROM todos WHERE id = ?";
      const [rows] = await connection.execute<Todo[] & RowDataPacket[]>(checkSql, [createdID]);
      const savedTodo = rows[0] as Todo;

      expect(savedTodo.id).toBe(createdID);
      expect(savedTodo.title).toBe(newTodo.title);
      expect(savedTodo.description).toBe(newTodo.description);
    });

    it("異常系：データベース操作でエラーが発生した場合、SqlErrorが返ること", async () => {
      const repository = new TodoRepository(connection);
      const newTodo: Todo = { title: "テスト用タイトル", description: "テスト用詳細" };

      // 🌟 本物の connection を監視し、この1回だけ強制的にエラーを発生させる（スパイ）
      jest.spyOn(connection, "execute").mockRejectedValueOnce(new Error("強制的なDBエラー"));

      const result = await repository.create(newTodo);
      expect(result instanceof SqlError).toBeTruthy();
    });
  });

  describe("findAll (全件取得) のテスト", () => {
    it("正常系：保存されているすべてのTodoが取得できること", async () => {
      // 準備（あらかじめ生SQLでテストデータを2件入れておく）
      await connection.execute("INSERT INTO todos (title, description) VALUES (?, ?)", ["ダミー1", "詳細1"]);
      await connection.execute("INSERT INTO todos (title, description) VALUES (?, ?)", ["ダミー2", "詳細2"]);

      const repository = new TodoRepository(connection);
      const result = await repository.findAll();

      if (result instanceof Error) throw new Error(`エラーが発生しました: ${result.message}`);

      expect(result.length).toBe(2);
      expect(result[0].title).toBe("ダミー1");
    });

    it("異常系：データベース操作でエラーが発生した場合、SqlErrorが返ること", async () => {
      const repository = new TodoRepository(connection);
      jest.spyOn(connection, "execute").mockRejectedValueOnce(new Error("強制的なDBエラー"));

      const result = await repository.findAll();
      expect(result instanceof SqlError).toBeTruthy();
    });
  });

  describe("getByID (1件取得) のテスト", () => {
    it("正常系：指定したIDのTodoが取得できること", async () => {
      // 準備（テストデータを1件入れて、発行されたIDを記憶しておく）
      const [insertResult] = await connection.execute<ResultSetHeader>(
        "INSERT INTO todos (title, description) VALUES (?, ?)",
        ["対象のTodo", "対象の詳細"],
      );
      const targetId = insertResult.insertId;

      const repository = new TodoRepository(connection);
      const result = await repository.getByID(targetId);

      if (result instanceof Error) throw new Error(`エラーが発生しました: ${result.message}`);
      expect(result.id).toBe(targetId);
      expect(result.title).toBe("対象のTodo");
    });

    it("異常系(404)：存在しないIDを指定した場合、NotFoundDataError が返ること", async () => {
      const repository = new TodoRepository(connection);
      const result = await repository.getByID(999); // 絶対に存在しないID

      expect(result instanceof NotFoundDataError).toBeTruthy();
    });

    it("異常系(500)：データベース操作でエラーが発生した場合、SqlErrorが返ること", async () => {
      const repository = new TodoRepository(connection);
      jest.spyOn(connection, "execute").mockRejectedValueOnce(new Error("強制的なDBエラー"));

      const result = await repository.getByID(1);
      expect(result instanceof SqlError).toBeTruthy();
    });
  });
});