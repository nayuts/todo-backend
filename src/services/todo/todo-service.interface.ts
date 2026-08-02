// src/services/todo/todo-service.interface.ts
import { Todo } from "../../models/todo";

export interface ITodoService {
  findAll(): Promise<Todo[] | Error>;
  getByID(id: number): Promise<Todo | Error>;
  create(todo: Todo): Promise<number | Error>;
  update(id: number, todo: Todo): Promise<void | Error>;
  delete(id: number): Promise<void | Error>;
}