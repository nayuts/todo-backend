// src/server.ts
import express, { Express } from "express";
import cors from "cors";
// import mysql, { Connection } from "mysql2/promise";
import * as dotenv from "dotenv";
import { PrismaClient } from "./generated/prisma/client";

// 🌟 自分たちが作った各層のパーツをインポート
import { TodoRepository } from "./repositories/todo/todo-repository";
import { TodoService } from "./services/todo/todo-service";
import { TodoController } from "./controllers/todo/todo-controller";

async function main() {
  dotenv.config();
  const { PORT, MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASS, MYSQL_DB } = process.env;
  const app: Express = express();

  // サーバーの立ち上げ
  app.listen(parseInt(PORT as string), function () {
    console.log("Node.js is listening to PORT: " + PORT);
  });

  // ミドルウェア設定
  app.disable("x-powered-by");
  app.use(cors()).use(express.json());

  // 1. データベース接続をPrismaに変更
  const prisma = new PrismaClient();

  // 2. PrismaをRepositoryに渡す
  const todoRepository = new TodoRepository(prisma);
  
  // 2. Repositoryを「Service（脳みそ）」に渡す
  const todoService = new TodoService(todoRepository);
  
  // 3. Serviceを「Controller（受付係）」に渡す
  const todoController = new TodoController(todoService);

  // 🌟 最後に、組み立てたControllerのルーティングをExpressアプリに登録する
  app.use("/api/todos", todoController.router);
}

main();