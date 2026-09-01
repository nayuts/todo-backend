// src/tests/unit/middleware/auth.test.ts
import { Request, Response, NextFunction } from "express";
import { requireAuth } from "../../../middleware/auth";
import * as tokenUtils from "../../../utils/token";

jest.mock("../../../utils/token");

describe("Auth Middleware (requireAuth)", () => {
  it("Authorizationヘッダーがない場合、401を返し next を呼ばないこと", () => {
    // 🌟 準備 (Arrange)
    const mockRequest: Partial<Request> = { headers: {} };
    const mockResponse: Partial<Response> = {
      status: jest.fn().mockReturnThis(), // res.status(401).json() のチェーン呼び出しに対応
      json: jest.fn(),
    };
    const nextFunction: NextFunction = jest.fn();

    // 🌟 実行 (Act)
    requireAuth(mockRequest as Request, mockResponse as Response, nextFunction);

    // 🌟 確認 (Assert)
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: "ログインが必要です" });
    expect(nextFunction).not.toHaveBeenCalled(); // 門を開けていないことを証明
  });

  it("有効なトークンの場合、res.locals にペイロードを保存し、next を呼ぶこと", () => {
    // 🌟 準備 (Arrange)
    const mockRequest: Partial<Request> = { 
      headers: { authorization: "Bearer valid_token" } 
    };
    const mockResponse: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {}, // ユーザー情報を保存する控室
    };
    const nextFunction: NextFunction = jest.fn();
    
    // verifyAccessToken が「正しいユーザー情報」を返すように偽装する
    const validPayload = { userId: 1, name: "テスト", email: "test@example.com" };
    (tokenUtils.verifyAccessToken as jest.Mock).mockReturnValue(validPayload);

    // 🌟 実行 (Act)
    requireAuth(mockRequest as Request, mockResponse as Response, nextFunction);

    // 🌟 確認 (Assert)
    expect(mockResponse.locals?.payload).toEqual(validPayload); // 控室に保存されたか
    expect(nextFunction).toHaveBeenCalled(); // 門を開けたか
  });
});
