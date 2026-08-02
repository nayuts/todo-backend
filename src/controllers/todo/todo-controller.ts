// src/controllers/todo/todo-controller.ts
import { Router } from "express";
import { ITodoService } from "../../services/todo/todo-service.intercface";
import { NotFoundDataError } from "../../utils/error";
import { Todo } from "../../models/todo";

export class TodoController {
  private todoService: ITodoService;
  public router: Router; // 外部（server.ts）にルーティングを渡すための変数

  // 🌟 依存性の注入（DI）：ここでService層を受け取ります！
  constructor(todoService: ITodoService) {
    this.todoService = todoService;
    this.router = Router();

    // 1. 全件取得 (GET: /api/todos)
    this.router.get("/", async (_, res) => {
      const result = await this.todoService.findAll();

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
      const todo: Todo = req.body;
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
      const result = await this.todoService.delete(id);

      if (result instanceof Error) {
        res.status(500).send();
        return;
      }
      // 204: No Content（削除成功で返すデータがない時の標準的なコード）
      res.status(204).send();
    });
  }
}
