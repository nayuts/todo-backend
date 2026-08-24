// src/repositories/user/user-repository.ts
import { PrismaClient } from "../../generated/prisma/client";
import { User } from "../../models/user";
import { NotFoundDataError, SqlError } from "../../utils/error";
import { IUserRepository } from "./user-repository.interface";

export class UserRepository implements IUserRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public async getByEmail(email: string): Promise<User | Error> {
      try {
        const user = await this.prisma.user.findUnique({
          where: {
            email: email
          },
        });
        if (!user) {
          return new NotFoundDataError("ユーザーが見つかりません");
        }
        return user;
      } catch (error) {
        return new SqlError("ユーザーの検索に失敗しました");
      }
    }

  public async create(user: User): Promise<number | Error> {
    try {
      const result = await this.prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          password: user.password,
        },
      });
      return result.id;
    } catch (error) {
      return new SqlError("ユーザーの作成に失敗しました");
    }
  }
}
