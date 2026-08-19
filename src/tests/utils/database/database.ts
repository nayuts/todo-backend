// src/tests/utils/database/database.ts
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../../../generated/prisma/client";
import * as dotenv from "dotenv";

// 🌟 すでに作成されたPrismaClientを保存しておくための変数
let prismaInstance: PrismaClient | null = null;

export function createDBConnection(): PrismaClient {
  // 🌟 シングルトンパターン：すでに作られていれば、新しく作らずに既存のものを使い回す
  if (prismaInstance) {
    return prismaInstance;
  }

  // テスト実行時に環境変数を読み込む
  dotenv.config();
  const { MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASS, MYSQL_DB } = process.env;

  // v7仕様：MySQL用のアダプターを作成
  const adapter = new PrismaMariaDb({
    host: MYSQL_HOST,
    port: parseInt(MYSQL_PORT as string),
    user: MYSQL_USER,
    password: MYSQL_PASS,
    database: MYSQL_DB,
  });

  // 初回のみ新しく作成し、変数に保存しておく
  prismaInstance = new PrismaClient({ adapter });
  
  return prismaInstance;
}
