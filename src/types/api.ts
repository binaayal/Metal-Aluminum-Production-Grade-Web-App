import { User } from './domain';

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}

export interface AuthResponse {
  user: User;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}
