import prisma from '../../lib/prisma.js';
import type { Role } from '@prisma/client';
import type { UserResponse } from './types.js';

function toUserResponse(user: { id: string; name: string; email: string; role: Role; active: boolean; createdAt: Date; updatedAt: Date }): UserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function findAllUsers(): Promise<UserResponse[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return users.map(toUserResponse);
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
}

export async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}): Promise<UserResponse> {
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      role: data.role,
      active: true,
    },
  });
  return toUserResponse(user);
}

export async function updateUser(
  id: string,
  data: { name?: string; role?: Role; active?: boolean }
): Promise<UserResponse> {
  const user = await prisma.user.update({
    where: { id },
    data,
  });
  return toUserResponse(user);
}
