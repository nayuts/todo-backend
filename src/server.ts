// src/server.ts
import express, { Express } from "express";
import cors from "cors";
import mysql, { Connection } from "mysql2/promise";
import * as dotenv from "dotenv";

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

  // データベースへの接続
  const connection: Connection = await mysql.createConnection({
    host: MYSQL_HOST,
    port: parseInt(MYSQL_PORT as string),
    user: MYSQL_USER,
    password: MYSQL_PASS,
    database: MYSQL_DB,
  });

  // 🌟 三層アーキテクチャの組み立て（DI：依存性の注入の連鎖）
  // 1. データベース接続を「Repository（倉庫番）」に渡す
  const todoRepository = new TodoRepository(connection);
  
  // 2. Repositoryを「Service（脳みそ）」に渡す
  const todoService = new TodoService(todoRepository);
  
  // 3. Serviceを「Controller（受付係）」に渡す
  const todoController = new TodoController(todoService);

  // 🌟 最後に、組み立てたControllerのルーティングをExpressアプリに登録する
  app.use("/api/todos", todoController.router);
}

main();