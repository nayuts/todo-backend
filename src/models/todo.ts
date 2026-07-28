// src/models/todo.ts
export type Todo = {
  id?: number;
  title: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
};