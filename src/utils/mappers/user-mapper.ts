import { User as PrismaUser } from "../../generated/prisma/client";
import { User } from "../../models/user";

export const UserMapper = {
  toDomain: (prismaUser: PrismaUser): User => {
    return {
      id: prismaUser.id,
      name: prismaUser.name,
      email: prismaUser.email,
      password: prismaUser.password,
      createdAt: prismaUser.created_at,
      updatedAt: prismaUser.updated_at,
    };
  },
};
