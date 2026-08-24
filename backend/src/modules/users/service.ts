import bcrypt from 'bcrypt';
import { ValidationError, NotFoundError } from '../../lib/errors.js';
import * as repo from './repository.js';
import type { Role } from '@prisma/client';
import type { UserResponse } from './types.js';

export async function listUsers(): Promise<UserResponse[]> {
  return repo.findAllUsers();
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: string;
}): Promise<UserResponse> {
  // Check for duplicate email
  const existing = await repo.findUserByEmail(data.email);
  if (existing) {
    throw new ValidationError('A user with this email already exists.', {
      email: 'Email is already taken',
    });
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  return repo.createUser({
    name: data.name,
    email: data.email,
    passwordHash,
    role: data.role as Role,
  });
}

export async function updateUser(
  id: string,
  data: { name?: string; role?: string; active?: boolean }
): Promise<UserResponse> {
  const existing = await repo.findUserById(id);
  if (!existing) {
    throw new NotFoundError('User', id);
  }

  return repo.updateUser(id, {
    name: data.name,
    role: data.role as Role | undefined,
    active: data.active,
  });
}
