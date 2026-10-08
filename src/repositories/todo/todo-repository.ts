// src/repositories/todo/todo-repository.ts
import { Todo } from "../../models/todo";
import { PrismaClient } from "../../generated/prisma/client";
import { NotFoundDataError, SqlError } from "../../utils/error";
import { ITodoRepository } from "./todo-repository.interface";
import { TodoMapper } from "../../utils/mappers/todo-mapper";

export class TodoRepository implements ITodoRepository {
  private prisma: PrismaClient;

  // connectionの代わりに、PrismaClientを受け取るように変更
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // 🌟 変更：誰のTodoを取り出すか、引数で userId を受け取るようにする
  public async findAll(userId: number): Promise<Todo[] | Error> {
    try {
      // 🌟 重要：Prismaを使って、user_id が一致するTodo「だけ」を検索する！
      const prismaTodos = await this.prisma.todo.findMany({
        where: { user_id: userId } // 👈 これが超重要！
      });
      const todos = prismaTodos.map((todo) => TodoMapper.toDomain(todo));
      return todos;
    } catch (error) {
      return new SqlError("Todoの取得に失敗しました");
    }
  }

  public async getByID(id: number): Promise<Todo | Error> {
    try {
      const prismaTodo = await this.prisma.todo.findUnique({ where: { id: id } });
      if (!prismaTodo) return new NotFoundDataError(`todo is not found`);
      
      // 🌟 Mapperを使って変換
      const todo = TodoMapper.toDomain(prismaTodo);
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
          description: todo.description,
          user_id: todo.userId
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

  public async delete(id: number, userId: number): Promise<void | Error> {
    try {
      const targetTodo = await this.prisma.todo.findFirst({ 
        where: { id: id, user_id: userId } 
      });
      if (!targetTodo) {
        return new NotFoundDataError(`todo is not found`);
      }
    } catch (err) {
      return new SqlError(`sql error`);
    }
    try {
      // 生SQL: DELETE FROM todos...
      await this.prisma.todo.delete({
        where: { id: id }
      });
    } catch (err) {
      return new SqlError(`sql error`);
    }
  }
}
