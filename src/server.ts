// src/server.ts
import express, { Express } from "express";
import cors from "cors";
// mysql2から、Connectionや型（RowDataPacketなど）も一緒にインポートします
import mysql, { Connection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import * as dotenv from "dotenv";

async function main() {
  dotenv.config();
  // process.env から環境変数を取得
  const { PORT, MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASS, MYSQL_DB } = process.env;
  
  // Expressアプリの型を Express と指定
  const app: Express = express();

  // process.env から取得した値は「文字列 または undefined」になるため、
  // as string を使って「絶対に文字列が入っている」とコンパイラに伝えます（型アサーション）
  app.listen(parseInt(PORT as string), function () {
    console.log(`Node.js is listening to PORT: ${PORT}`);
  });

  app.disable("x-powered-by");
  app.use(cors()).use(express.json());

  // データベース接続（Connection型を指定）
  const connection: Connection = await mysql.createConnection({
    host: MYSQL_HOST,
    port: parseInt(MYSQL_PORT as string),
    user: MYSQL_USER,
    password: MYSQL_PASS,
    database: MYSQL_DB,
  });

  // 👇 ここから下に型定義とAPIの処理を書いていきます
  type Todo = {
    id?: number; // 作成時はまだIDがないので任意（?）にする
    title: string;
    description: string;
    createdAt?: Date;
    updatedAt?: Date;
  };

    // 1. Todo一覧を取得するAPI
  app.get("/api/todos", async (req, res) => {
    try {
      const sql = "SELECT * FROM todos";
      // 🌟 execute<Todo[] & RowDataPacket[]> で取得結果の型を指定します
      const [rows] = await connection.execute<Todo[] & RowDataPacket[]>(sql);
      res.json(rows);
    } catch (err) {
      // 🌟 try-catch の err は unknown 型になるため、instanceof Error で型を絞り込みます
      if (err instanceof Error) {
        console.error(`execute error: ${err.message}`);
      }
      res.status(500).send();
    }
  });

  // 2. 特定のTodoを1件取得するAPI
  app.get("/api/todos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // 🛡️ セキュリティ対策：?（プレースホルダー）を使います
      const sql = "SELECT * FROM todos WHERE id = ?";
      const [rows] = await connection.execute<Todo[] & RowDataPacket[]>(sql, [id]);
      
      // 1件取得なので、配列の0番目を返します
      res.json(rows[0]);
    } catch (err) {
      if (err instanceof Error) {
        console.error(`execute error: ${err.message}`);
      }
      res.status(500).send();
    }
  });

    // 3. Todoを作成するAPI
  app.post("/api/todos", async (req, res) => {
    try {
      // 送られてきたデータが Todo 型であることを明示
      const todo: Todo = req.body;
      const sql = "INSERT INTO todos (title, description) VALUES (?, ?)";
      
      // 🌟 データの変更を伴う処理の型は ResultSetHeader を指定します
      const [result] = await connection.execute<ResultSetHeader>(sql, [todo.title, todo.description]);
      
      res.status(201).json(result.insertId);
    } catch (err) {
      if (err instanceof Error) {
        console.error(`execute error: ${err.message}`);
      }
      res.status(500).send();
    }
  });

  // 4. Todoを更新するAPI
  app.put("/api/todos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const todo: Todo = req.body;
      const sql = "UPDATE todos SET title = ?, description = ? WHERE id = ?";
      
      await connection.execute<ResultSetHeader>(sql, [todo.title, todo.description, id]);
      
      res.status(200).send();
    } catch (err) {
      if (err instanceof Error) {
        console.error(`execute error: ${err.message}`);
      }
      res.status(500).send();
    }
  });

  // 5. Todoを削除するAPI
  app.delete("/api/todos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sql = "DELETE FROM todos WHERE id = ?";
      
      await connection.execute<ResultSetHeader>(sql, [id]);
      
      res.status(204).send(); // 削除成功時は204(No Content)を返すのが一般的です
    } catch (err) {
      if (err instanceof Error) {
        console.error(`execute error: ${err.message}`);
      }
      res.status(500).send();
    }
  });
}

main();