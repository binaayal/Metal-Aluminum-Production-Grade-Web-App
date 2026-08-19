import prisma from '../../lib/prisma.js';
import bcrypt from 'bcrypt';
import { UnauthorizedError } from '../../lib/errors.js';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

export async function authenticateUser(email: string, password: string): Promise<SessionUser> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user || !user.active) {
    throw new UnauthorizedError('Invalid email or password.');
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    throw new UnauthorizedError('Invalid email or password.');
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
  };
}

export async function getUserById(id: string): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user || !user.active) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
  };
}
