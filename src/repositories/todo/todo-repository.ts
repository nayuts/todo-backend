// src/repositories/todo/todo-repository.ts
import { Todo } from "../../models/todo";
import { Connection, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { NotFoundDataError, SqlError } from "../../utils/error";
import { ITodoRepository } from "./todo-repository.interface";

export class TodoRepository implements ITodoRepository {
  private connection: Connection;

  // コンストラクタ：外部からデータベースの接続情報を受け取ります
  constructor(connection: Connection) {
    this.connection = connection;
  }

  public async findAll(): Promise<Todo[] | Error> {
    try {
      const sql = "SELECT * FROM todos";
      const [rows] = await this.connection.execute<Todo[] & RowDataPacket[]>(sql);
      return rows;
    } catch (err) {
      console.error(`TodoRepository.findAll: ${err}`);
      return new SqlError(`sql error`);
    }
  }

  public async getByID(id: number): Promise<Todo | Error> {
    try {
      const sql = "SELECT * FROM todos WHERE id = ?";
      const [rows] = await this.connection.execute<Todo[] & RowDataPacket[]>(sql, [id]);

      if (rows.length === 0) {
        return new NotFoundDataError(`todo is not found`);
      }
      return rows[0];
    } catch (err) {
      console.error(`TodoRepository.getByID: ${err}`);
      return new SqlError(`sql error`);
    }
  }

  public async create(todo: Todo): Promise<number | Error> {
    try {
      // 🛡️ セキュリティ対策：?（プレースホルダー）を使ってSQLインジェクションを防ぎます！
      const sql = "INSERT INTO todos (title, description) VALUES (?, ?)";
      const [result] = await this.connection.execute<ResultSetHeader>(sql, [todo.title, todo.description]);
      return result.insertId;
    } catch (err) {
      console.error(`TodoRepository.create: ${err}`);
      return new SqlError(`sql error`);
    }
  }

  public async update(id: number, todo: Todo): Promise<void | Error> {
    try {
      const sql = "UPDATE todos SET title = ?, description = ? WHERE id = ?";
      const [result] = await this.connection.execute<ResultSetHeader>(sql, [todo.title, todo.description, id]);
      
      if (result.affectedRows === 0) {
        return new NotFoundDataError(`todo is not found`);
      }
    } catch (err) {
      console.error(`TodoRepository.update: ${err}`);
      return new SqlError(`sql error`);
    }
  }

  public async delete(id: number): Promise<void | Error> {
    try {
      const sql = "DELETE FROM todos WHERE id = ?";
      const [result] = await this.connection.execute<ResultSetHeader>(sql, [id]);
      
      if (result.affectedRows === 0) {
        return new NotFoundDataError(`todo is not found`);
      }
    } catch (err) {
      console.error(`TodoRepository.delete: ${err}`);
      return new SqlError(`sql error`);
    }
  }
}