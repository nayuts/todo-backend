// src/repositories/todo/todo-repository.ts
import { Todo } from "../../models/todo";
import { PrismaClient } from "../../generated/prisma/client";
import { NotFoundDataError, SqlError } from "../../utils/error";
import { ITodoRepository } from "./todo-repository.interface";

export class TodoRepository implements ITodoRepository {
  private prisma: PrismaClient;

  // connectionの代わりに、PrismaClientを受け取るように変更
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public async findAll(): Promise<Todo[] | Error> {
    try {
      // 生SQL: SELECT * FROM todos;
      return await this.prisma.todo.findMany();
    } catch (err) {
      return new SqlError(`sql error`);
    }
  }

  public async getByID(id: number): Promise<Todo | Error> {
    try {
      // 生SQL: SELECT * FROM todos WHERE id = ?;
      const todo = await this.prisma.todo.findUnique({
        where: { id: id }
      });

      if (!todo) return new NotFoundDataError(`todo is not found`);
      return todo;
    } catch (err) {
      return new SqlError(`sql error`);
    }
  }

  public async create(todo: Todo): Promise<number | Error> {
    try {
      // 生SQL: INSERT INTO todos...
      const result = await this.prisma.todo.create({
        data: {
          title: todo.title,
          description: todo.description
        }
      });
      return result.id;
    } catch (err) {
      return new SqlError(`sql error`);
    }
  }

  public async update(id: number, todo: Todo): Promise<void | Error> {
    try {
      // 生SQL: UPDATE todos SET...
      await this.prisma.todo.update({
        where: { id: id },
        data: {
          title: todo.title,
          description: todo.description
        }
      });
    } catch (err) {
      // Prismaの「見つからないエラー」のコード
      if (err instanceof Error && err.message.includes("Record to update not found")) {
        return new NotFoundDataError(`todo is not found`);
      }
      return new SqlError(`sql error`);
    }
  }

  public async delete(id: number): Promise<void | Error> {
    try {
      // 生SQL: DELETE FROM todos...
      await this.prisma.todo.delete({
        where: { id: id }
      });
    } catch (err) {
      if (err instanceof Error && err.message.includes("Record to delete does not exist")) {
        return new NotFoundDataError(`todo is not found`);
      }
      return new SqlError(`sql error`);
    }
  }
}
