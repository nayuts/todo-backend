// src/repositories/user/user-repository.interface.ts
import { promises } from "node:dns";
import { User } from "../../models/user";

export interface IUserRepository {
  create(user: User): Promise<number | Error>;
  getByEmail(email: string): Promise<User | Error>;
}
