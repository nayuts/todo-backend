// src/tests/api/todo.test.ts
import axios from "axios";
import { Todo } from "../../models/todo";
import { createDBConnection } from "../utils/database/database";

// 🌟 database.ts が環境変数の読み込みやPrismaの初期化をすべてやってくれます！
const prisma = createDBConnection();

// Axiosの初期設定：Thunder Clientで毎回URLを打ち込んでいた設定を自動化します
const PORT = process.env.PORT || "4000";
axios.defaults.baseURL = `http://localhost:${PORT}`;
axios.defaults.headers.common = { "Content-Type": "application/json" };
// 404や500エラーが返ってきたときも、Jestがクラッシュせずにレスポンスを受け取れるようにする設定
axios.defaults.validateStatus = (status) => status >= 200 && status < 500;

// 💡 テストデータを準備するためのヘルパー関数（Prisma仕様）
async function createTodoTestDatas(num: number): Promise<Todo[]> {
  const todoList: Todo[] = [];
  for (let index = 0; index < num; index++) {
    const created = await prisma.todo.create({
      data: {
        title: `サンプルタイトル${index}`,
        description: `サンプル詳細${index}`,
      },
    });
    todoList.push(created);
  }
  return todoList;
}

beforeEach(async () => {
  await prisma.todo.deleteMany(); // 毎回DBをクリア
});

afterAll(async () => {
  await prisma.$disconnect(); // コネクションプールの破壊を防ぐため afterAll を使用
});

describe("Todo APIの統合テスト", () => {
  // 👇 ここにテストケースを書いていきます
  describe("GET /api/todos (全件取得)", () => {
    it("5件のTodoがある場合、ステータス200と5件のデータが返ること", async () => {
      // 1. 準備：ヘルパー関数を使って、DBにあらかじめ5件のデータを入れる
      const createdTodoList = await createTodoTestDatas(5);

      // 2. 実行：Axiosを使って、本物のAPIエンドポイントにGETリクエストを投げる！
      const response = await axios.get<Todo[]>("/api/todos");

      // 3. 確認：ステータスコードは200か？ 件数は5件か？
      expect(response.status).toBe(200);
      expect(response.data.length).toBe(5);
      expect(response.data[0].title).toBe(createdTodoList[0].title);
    });

    it("データが空の場合、ステータス200と空の配列が返ること", async () => {
      const response = await axios.get<Todo[]>("/api/todos");
      expect(response.status).toBe(200);
      expect(response.data.length).toBe(0);
    });
  });

  describe("GET /api/todos/:id (1件取得)", () => {
    it("存在するIDを指定した場合、ステータス200と該当のデータが返ること", async () => {
      const createdTodoList = await createTodoTestDatas(1);
      const targetTodo = createdTodoList[0];

      // 実行：URLパラメータにIDを埋め込んでGETリクエスト
      const response = await axios.get<Todo>(`/api/todos/${targetTodo.id}`);

      expect(response.status).toBe(200);
      expect(response.data.id).toBe(targetTodo.id);
      expect(response.data.title).toBe(targetTodo.title);
    });

    it("存在しないIDを指定した場合、ステータス404が返ること", async () => {
      const response = await axios.get<Todo>("/api/todos/999");
      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/todos (新規作成)", () => {
    it("データを送信した場合、ステータス201と作成されたIDが返ること", async () => {
      const requestBody: Todo = {
        title: "新タスク",
        description: "APIテストから作成"
      };

      // 実行：リクエストボディ（JSON）を付けてPOSTリクエスト
      const response = await axios.post<number>("/api/todos", requestBody);
      const createdId = response.data;

      expect(response.status).toBe(201);
      
      // 念のため、本当にDBに入ったかもPrismaで直接確認する
      const savedTodo = await prisma.todo.findUnique({
        where: { id: createdId }
      });
      expect(savedTodo?.title).toBe(requestBody.title);
    });
  });

  // 演習課題
  describe("PUT /api/todos/:id (更新)", () => { 
    it("正常系： データを1件登録しておき、そのIDに対して axios.put で新しいデータを送信する。ステータスコードが 200 であり、DBの中身が書き換わっていることをPrismaで確認する", async () => {
      // todoを作っておく 
      const createdTodoList = await createTodoTestDatas(1); 
      const targetTodo = createdTodoList[0]; 
      const updateData: Todo = {
        title: "更新タスク", 
        description: "更新した内容",
      }; 

      const response = await axios.put<Todo>(`/api/todos/${targetTodo.id}`,updateData); 
      expect(response.status).toBe(200);

      const savedTodo = await prisma.todo.findUnique({ 
        where: { id: targetTodo.id}, 
      }); 
      expect(savedTodo?.title).toBe(updateData.title); 
      expect(savedTodo?.description).toBe(updateData.description); 
    }); 
    it("異常系： 存在しないID（0 や 999）に対して axios.put を行い、ステータスコード 404 が返ってくることを確認する", async () => { 
      const updateData: Todo = { 
        title: "更新タスク", 
        description: "更新した内容",
      }; 
      const response = await axios.put<Todo>("/api/todos/999",updateData); 
      expect(response.status).toBe(404); 
    }); 
  }); 
    
  describe("DELETE /api/todos/:id (削除)", () => { 
    it("正常系： データを1件登録しておき、そのIDに対して axios.delete を実行する。ステータスコードが 204 であり、DBからデータが消えていること（findUnique が null を返すこと）をPrismaで確認する", async () => { 
      // todoを作っておく 
      const createdTodoList = await createTodoTestDatas(1); 
      const targetTodo = createdTodoList[0]; 

      const response = await axios.delete<Todo>(`/api/todos/${targetTodo.id}`); 
      expect(response.status).toBe(204); 
      
      const savedTodo = await prisma.todo.findUnique({ 
        where: { id: targetTodo.id}, 
      });
      expect(savedTodo).toBe(null); 
    }); 
  });
});


