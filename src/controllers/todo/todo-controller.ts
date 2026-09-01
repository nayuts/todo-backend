// src/controllers/todo/todo-controller.ts
import { Request, Response, Router } from "express";
import { ITodoService } from "../../services/todo/todo-service.interface";
import { NotFoundDataError } from "../../utils/error";
import { Todo } from "../../models/todo";
import { requireAuth } from "../../middleware/auth";
import { todo } from "node:test";

export class TodoController {
  private todoService: ITodoService;
  public router: Router; // 外部（server.ts）にルーティングを渡すための変数

  // 🌟 依存性の注入（DI）：ここでService層を受け取ります！
  constructor(todoService: ITodoService) {
    this.todoService = todoService;
    this.router = Router();

    // router.use を使うと、「これより下に書かれているすべてのAPI」の前に門番が立ちます。
    this.router.use(requireAuth);
    // ※これ以降のAPIは、ログインしていないと絶対にアクセスできません

    // 1. 全件取得 (GET: /api/todos)
    this.router.get("/", async (req: Request, res: Response) => {
      // 🌟 1. 門番が確認済みの安全なユーザーIDを控室から取り出す
      const payload = res.locals.payload;

      // 🌟 2. そのIDをServiceに渡す
      const result = await this.todoService.findAll(payload.userId);

      if (result instanceof Error) {
        res.status(500).send();
        return;
      }
      res.status(200).json(result);
    });

    // 2. 1件取得 (GET: /api/todos/:id)
    this.router.get("/:id", async (req, res) => {
      const id = parseInt(req.params.id);
      const result = await this.todoService.getByID(id);

      if (result instanceof NotFoundDataError) {
        // Service層が「データがないよ」と教えてくれたので、受付係は 404 を返します
        res.status(404).json(result.message);
        return;
      }
      if (result instanceof Error) {
        res.status(500).send();
        return;
      }
      res.status(200).json(result);
    });

    // 3. 新規作成 (POST: /api/todos)
    this.router.post("/", async (req, res) => {
      const { title, description } = req.body;
      // 安全なユーザーデータを取り出す
      const payload = res.locals.payload;

      const todo: Todo = {
        userId: payload.userId,
        title: title,
        description: description,
      }
      const result = await this.todoService.create(todo);

      if (result instanceof Error) {
        res.status(500).send();
        return;
      }
      // 201: Created（作成成功）
      res.status(201).json(result);
    });

    // 4. 更新 (PUT: /api/todos/:id)
    this.router.put("/:id", async (req, res) => {
      const id = parseInt(req.params.id);
      const todo: Todo = req.body;

      const payload = res.locals.payload;
      // 上書きセット
      todo.userId = payload.userId;

      const result = await this.todoService.update(id, todo);

      if (result instanceof NotFoundDataError) {
        res.status(404).send();
        return;
      }
      if (result instanceof Error) {
        res.status(500).send();
        return;
      }
      res.status(200).send();
    });

    // 5. 削除 (DELETE: /api/todos/:id)
    this.router.delete("/:id", async (req, res) => {
      const id = parseInt(req.params.id);
      const payload = res.locals.payload;
      const result = await this.todoService.delete(id, payload.userId);

      if (result instanceof Error) {
        res.status(500).send();
        return;
      }
      // 204: No Content（削除成功で返すデータがない時の標準的なコード）
      res.status(204).send();
    });
  }
}
