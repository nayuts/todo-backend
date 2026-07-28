// src/server.ts
import express, { Express } from "express";
import cors from "cors";
import mysql, { Connection } from "mysql2/promise";
import * as dotenv from "dotenv";

import { TodoRepository } from "./repositories/todo/todo-repository";
import { Todo } from "./models/todo";
import { NotFoundDataError } from "./utils/error";

async function main() {
  dotenv.config();
  const { PORT, MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASS, MYSQL_DB } = process.env;
  const app: Express = express();

  app.listen(parseInt(PORT as string), function () {
    console.log(("Node.js is listening to PORT: " + PORT) as string);
  });

  app.disable("x-powered-by");
  app.use(cors()).use(express.json());

  const connection: Connection = await mysql.createConnection({
    host: MYSQL_HOST,
    port: parseInt(MYSQL_PORT as string),
    user: MYSQL_USER,
    password: MYSQL_PASS,
    database: MYSQL_DB,
  });

  // 🌟 ここがポイント：Repositoryを生成し、DB接続情報を渡す（依存性の注入）
  const todoRepository = new TodoRepository(connection);

  // --- APIのルーティング ---

  // 1. 全件取得
  app.get("/api/todos", async (req, res) => {
    // SQLを書かずに、Repositoryのメソッドを呼ぶだけ！
    const result = await todoRepository.findAll();

    if (result instanceof Error) {
      res.status(500).send();
      return;
    }
    res.json(result);
  });

  // 2. 1件取得
  app.get("/api/todos/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const result = await todoRepository.getByID(id);

    // Repositoryが独自エラーを返してくれたおかげで、404判定が簡単にできる！
    if (result instanceof NotFoundDataError) {
      res.status(404).send();
      return;
    }
    if (result instanceof Error) {
      res.status(500).send();
      return;
    }
    res.json(result);
  });

  // 3. 作成
  app.post("/api/todos", async (req, res) => {
    const todo: Todo = req.body;
    const result = await todoRepository.create(todo);

    if (result instanceof Error) {
      res.status(500).send();
      return;
    }
    res.status(201).json(result);
  });

  // 4. 更新
  app.put("/api/todos/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const todo: Todo = req.body;

    // ① 存在チェック
    const getResult = await todoRepository.getByID(id);
    if (getResult instanceof NotFoundDataError) {
      res.status(404).send();
      return;
    }

    // ② 更新実行
    const result = await todoRepository.update(id, todo);
    if (result instanceof Error) {
      res.status(500).send();
      return;
    }
    res.status(200).send();
  });

  // 5. 削除
  app.delete("/api/todos/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const result = await todoRepository.delete(id);

    if (result instanceof NotFoundDataError) {
      res.status(404).send();
      return;
    }
    if (result instanceof Error) {
      res.status(500).send();
      return;
    }
    // 削除成功時は 204 No Content を返すのが一般的です
    res.status(204).send();
  });
}

main();