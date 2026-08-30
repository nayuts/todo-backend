import { Todo as PrismaTodo } from "../../generated/prisma/client";
import { Todo } from "../../models/todo";

export const TodoMapper = {
  // DBの型 ➡ アプリの型への変換
  toDomain: (prismaTodo: PrismaTodo): Todo => {
    return {
      id: prismaTodo.id,
      userId: prismaTodo.user_id, // ここで変換！
      title: prismaTodo.title,
      description: prismaTodo.description,
      createdAt: prismaTodo.created_at,
      updatedAt: prismaTodo.updated_at,
    };
  },
};
