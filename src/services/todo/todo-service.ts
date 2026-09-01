// src/services/todo/todo-service.ts
import { Todo } from "../../models/todo";
import { ITodoRepository } from "../../repositories/todo/todo-repository.interface";
import { ITodoService } from "./todo-service.interface";
import { NotFoundDataError } from "../../utils/error";

export class TodoService implements ITodoService {
  private todoRepository: ITodoRepository;

  // 🌟 依存性の注入（DI）：ここでRepositoryを受け取ります！
  constructor(todoRepository: ITodoRepository) {
    this.todoRepository = todoRepository;
  }

  // 🌟 変更：Controllerから userId を受け取り、Repositoryにパスする
  public async findAll(userId: number): Promise<Todo[] | Error> {
    // 自分のTodoだけをDBから取得する
    const result = await this.todoRepository.findAll(userId);
    return result;
  }

  public async getByID(id: number): Promise<Todo | Error> {
    const result = await this.todoRepository.getByID(id);
    return result;
  }

  public async create(todo: Todo): Promise<number | Error> {
    const result = await this.todoRepository.create(todo);
    return result;
  }

  public async update(id: number, todo: Todo): Promise<void | Error> {
    // 💡 ここがビジネスロジック（脳みそ）の見せ場です！
    // 「更新する前に、そのデータが存在するか確認する」というルールをここで実行します。
    const getResult = await this.todoRepository.getByID(id); 

    // もし見つからなかったら（またはエラーなら）、ここでエラーを返す
    if (getResult instanceof Error) {
      return getResult;
    }
    
    if (getResult.userId !== todo.userId) {
      return new NotFoundDataError("データが見つかりません");
    }

    // 無事に存在確認ができたら、更新処理をRepositoryに依頼する
    const updateResult = await this.todoRepository.update(id, todo);
    return updateResult;
  }

  public async delete(id: number, userId: number): Promise<void | Error> {
    const result = await this.todoRepository.delete(id, userId);
    return result;
  }
}