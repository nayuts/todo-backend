// src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/token";

// 🌟 門番となるミドルウェア関数
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // 1. リクエストの「Authorization」ヘッダーを取り出す
  const authHeader = req.headers.authorization;

  // 2. ヘッダーが存在しない、または "Bearer " から始まっていなければ追い返す
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "ログインが必要です" });
    return;
  }

  // 3. "Bearer 実際のトークン文字列" のスペース部分で分割し、トークンだけを抽出する
  const token = authHeader.split(" ")[1];

  // 4. 通行証が本物か検証する
  const payload = verifyAccessToken(token);
  if (payload instanceof Error) {
    // 偽造されていたり期限切れなら追い返す
    res.status(401).json({ message: payload.message });
    return;
  }

  // 🌟 5. 超重要：通行証に書いてあった「ユーザー情報」を、サーバーの控室（res.locals）にメモしておく
  // これにより、この後のControllerで「今アクセスしてきているのは誰か」がわかるようになります！
  res.locals.payload = payload;

  // 6. 検証クリア！門を開けて次の処理（Controller）へ進ませる
  next();
}
