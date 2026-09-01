// src/tests/api/auth.test.ts
import axios from "axios";
import { createDBConnection } from "../utils/database/database";

const prisma = createDBConnection();
const PORT = process.env.PORT || "4000";
axios.defaults.baseURL = `http://localhost:${PORT}`;
axios.defaults.headers.common = { "Content-Type": "application/json" };
axios.defaults.validateStatus = (status) => status >= 200 && status < 500;

const testUser = {
  name: "Authテストユーザー",
  email: "auth_test@example.com",
  password: "password123",
};

beforeEach(async () => {
  await prisma.todo.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Auth APIの統合テスト", () => {
  describe("POST /api/auth/signup (新規登録)", () => {
    it("正しいデータを送信した場合、ステータス201とトークンが返ること", async () => {
      const response = await axios.post("/api/auth/signup", testUser);

      expect(response.status).toBe(201);
      expect(response.data.message).toBe("登録およびログイン成功！");
      // 🌟 JWT（通行証）がちゃんと発行されているか確認！
      expect(response.data.token).toBeDefined(); 
    });
  });

  describe("POST /api/auth/signin (ログイン)", () => {
    beforeEach(async () => {
      // ログインテストのために、あらかじめユーザーを登録しておく
      await axios.post("/api/auth/signup", testUser);
    });

    it("正しいメールアドレスとパスワードの場合、ステータス200とトークンが返ること", async () => {
      const response = await axios.post("/api/auth/signin", {
        email: testUser.email,
        password: testUser.password,
      });

      expect(response.status).toBe(200);
      expect(response.data.token).toBeDefined();
    });

    it("パスワードが間違っている場合、ステータス401が返ること", async () => {
      const response = await axios.post("/api/auth/signin", {
        email: testUser.email,
        password: "wrong_password", // 🌟 間違ったパスワード
      });

      expect(response.status).toBe(401);
      expect(response.data.message).toBe("メールアドレスまたはパスワードが間違っています");
    });
  });
});
