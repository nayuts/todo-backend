// src/tests/api/user.test.ts
import axios from "axios";
import { createDBConnection } from "../utils/database/database";
import { generateAccessToken } from "../../utils/token";

const prisma = createDBConnection();
const PORT = process.env.PORT || "4000";
axios.defaults.baseURL = `http://localhost:${PORT}`;
axios.defaults.headers.common = { "Content-Type": "application/json" };
axios.defaults.validateStatus = (status) => status >= 200 && status < 500;

let testUserId: number;

// テスト用の通行証（JWT）を発行するヘルパー関数
function getAuthHeader() {
  const token = generateAccessToken({
    userId: testUserId,
    name: "APIテストユーザー",
    email: "api_test@example.com",
  });
  return { Authorization: `Bearer ${token}` };
}

beforeEach(async () => {
  // DBのお掃除
  await prisma.todo.deleteMany();
  await prisma.user.deleteMany();

  // テスト用ユーザーの作成
  const testUser = await prisma.user.create({
    data: {
      name: "APIテストユーザー",
      email: `user_test_${Date.now()}@example.com`,
      password: "dummy_password",
    },
  });
  testUserId = testUser.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("User APIの統合テスト", () => {
  describe("GET /api/users/me (プロフィール取得)", () => {
    it("有効なトークンを送信した場合、ステータス200とパスワード抜きのプロフィールが返ること", async () => {
      // 🌟 実行 (Act)
      const response = await axios.get("/api/users/me", {
        headers: getAuthHeader(), // 門番を突破！
      });

      // 🌟 確認 (Assert)
      expect(response.status).toBe(200);
      expect(response.data.name).toBe("APIテストユーザー");
      
      // 🚨 APIのレスポンス（JSON）にもパスワードが含まれていないことを最終確認！
      expect(response.data.password).toBeUndefined();
    });

    it("トークンがない（未ログイン）場合、門番に弾かれて401が返ること", async () => {
      // 🌟 実行 (Act): ヘッダーなしでリクエスト
      const response = await axios.get("/api/users/me");

      // 🌟 確認 (Assert)
      expect(response.status).toBe(401);
      expect(response.data.message).toBe("ログインが必要です");
    });
  });
});
