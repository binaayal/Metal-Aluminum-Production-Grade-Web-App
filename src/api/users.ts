import { apiGet, apiPost, apiPatch } from './client';
import type { User } from '../types/domain';
import type { CreateUserInput, UpdateUserInput } from '../schemas/validation';

export async function getUsers(): Promise<User[]> {
  return apiGet<User[]>('/api/users');
}

export async function createUser(input: CreateUserInput): Promise<User> {
  return apiPost<User>('/api/users', input);
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<User> {
  return apiPatch<User>(`/api/users/${id}`, input);
}
