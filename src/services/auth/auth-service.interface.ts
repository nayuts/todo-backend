// src/services/auth/auth-service.interface.ts
import { User } from "../../models/user";

export interface IAuthService {
  signUp(user: User): Promise<number | Error>;
}
