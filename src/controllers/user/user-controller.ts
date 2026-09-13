// src/controllers/user/user-controller.ts
import { Request, Response, Router } from "express";
import { IUserService } from "../../services/user/user-service.interface";
import { requireAuth } from "../../middleware/auth";

export class UserController {
  private userService: IUserService;
  public router: Router;

  constructor(userService: IUserService) {
    this.userService = userService;
    this.router = Router();

    // 🌟 門番（requireAuth）を配置！通行証がない人はここで追い返されます
    this.router.get("/me", requireAuth, async (req: Request, res: Response) => {
      
      // 1. 門番が通行証から読み取ってくれた「確実な自分のID」を取り出す
      const payload = res.locals.payload;

      // 2. そのIDを使ってServiceにプロフィール取得を依頼する
      const result = await this.userService.getProfile(payload.userId);

      if (result instanceof Error) {
        res.status(404).json({ message: result.message });
        return;
      }

      // 3. パスワードが除外された安全なプロフィールを返す
      res.status(200).json(result);
    });
  }
}
