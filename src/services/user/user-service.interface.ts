// src/services/user/user-service.interface.ts
import { User } from "../../models/user";

export interface IUserService {
  // 🌟 Omit<User, "password"> を使うと、「User型からpasswordだけを除外した型」を作れます！
  getProfile(userId: number): Promise<Omit<User, "password"> | Error>;
}
