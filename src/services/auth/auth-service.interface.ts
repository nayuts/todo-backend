// src/services/auth/auth-service.interface.ts
import { User } from "../../models/user";

export interface IAuthService {
  signIn(email: string, password: string): Promise<string | Error>;
  signUp(user: User): Promise<string | Error>;
}
