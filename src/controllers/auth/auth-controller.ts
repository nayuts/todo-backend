// src/controllers/auth/auth-controller.ts
import { Request, Response, Router } from "express";
import { User } from "../../models/user";
import { AuthService } from "../../services/auth/auth-service";
import { ConflictDataError, UnauthorizedError } from "../../utils/error";

export class AuthController {
  private authService: AuthService;
  public router: Router;

  constructor(authService: AuthService) {
    this.authService = authService;
    this.router = Router();

    this.router.post("/signin", async (req: Request, res: Response) => {
      const { email, password } = req.body;
      
      const result = await this.authService.signIn(email, password);

      // 🌟 Service層が「認証失敗エラー」と教えてくれたので、受付係は 401（Unauthorized） を返します
      if (result instanceof UnauthorizedError) {
        res.status(401).json({ message: result.message });
        return;
      }

      // それ以外の予期せぬエラーは 500
      if (result instanceof Error) {
        res.status(500).json(result.message);
        return;
      }

      // 🌟 ここが実務のスタンダード！
      // 発行されたJWT（result）を JSON の `token` というキーに詰めて返します。
      // フロントエンドはこれを受け取り、以降のリクエストのヘッダーに付けて通信してきます。
      res.status(200).json({ message: "ログイン成功！", token: result });
    });

    // サインアップAPI（POST: /api/auth/signup）
    this.router.post("/signup", async (req: Request, res: Response) => {
      const user: User = req.body;
      
      const result = await this.authService.signUp(user);

      // ConflictDataError だった場合409 Conflict（データの競合） を返す
      if (result instanceof ConflictDataError) {
        res.status(409).json(result.message);
        return;
      }

      if (result instanceof Error) {
        res.status(500).json(result.message);
        return;
      }

      // 成功したら 201 Created と共に、JWTを返す
      res.status(201).json({ message: "登録成功", token: result });
    });
  }
}
