import { AuthUser } from './auth-user.model';

export interface Session {
  token: string;
  user: AuthUser;
}
