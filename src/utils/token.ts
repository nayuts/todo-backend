// src/utils/token.ts
import * as dotenv from "dotenv";
import * as jwt from "jsonwebtoken";

dotenv.config();
const { SECRET_KEY } = process.env; // .envから秘密の鍵を読み込む

// JWTの中に埋め込むデータ（荷物）の型
export type AccessTokenPayload = {
  userId: number;
  name: string;
  email: string;
};

// 🌟 JWT（通行証）を発行する関数
export function generateAccessToken(payload: AccessTokenPayload): string {
  const secretKey = SECRET_KEY as string;
  // payload（荷物）と secretKey（ハンコ）を使って、24時間有効なトークンを作成！
  const token = jwt.sign(payload, secretKey, { algorithm: "HS256", expiresIn: "24h" });
  return token;
}

// 🌟 JWT（通行証）が本物か検証する関数
export function verifyAccessToken(token: string): AccessTokenPayload | Error {
  const secretKey = SECRET_KEY as string;
  try {
    // jwt.verify が「署名（ハンコ）」と「有効期限」をチェックしてくれます！
    // 問題なければ、中に入っている荷物（payload）を取り出して返します。
    const decoded = jwt.verify(token, secretKey) as AccessTokenPayload;
    return decoded;
  } catch (e) {
    // 偽造されている、または24時間経って有効期限が切れている場合はエラー！
    return new Error("無効なトークン、または有効期限が切れています");
  }
}