// src/controllers/auth/auth-controller.ts
import { Request, Response, Router } from "express";
import { User } from "../../models/user";
import { AuthService } from "../../services/auth/auth-service";
import { ConflictDataError } from "../../utils/error";

export class AuthController {
  private authService: AuthService;
  public router: Router;

  constructor(authService: AuthService) {
    this.authService = authService;
    this.router = Router();

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

      // 成功したら 201 Created と共に、作成されたIDを返す
      res.status(201).json({ message: "登録成功", userId: result });
    });
  }
}
