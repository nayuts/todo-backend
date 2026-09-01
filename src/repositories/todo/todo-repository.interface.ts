// src/repositories/todo/todo-repository.interface.ts
import { Todo } from "../../models/todo";

export interface ITodoRepository {
  findAll(userId: number): Promise<Todo[] | Error>;
  getByID(id: number): Promise<Todo | Error>;
  create(todo: Todo): Promise<number | Error>;
  update(id: number, todo: Todo): Promise<void | Error>;
  delete(id: number, userId: number): Promise<void | Error>;
}