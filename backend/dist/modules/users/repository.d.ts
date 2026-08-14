import type { Role } from '@prisma/client';
import type { UserResponse } from './types.js';
export declare function findAllUsers(): Promise<UserResponse[]>;
export declare function findUserById(id: string): Promise<{
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    role: import("@prisma/client").$Enums.Role;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
} | null>;
export declare function findUserByEmail(email: string): Promise<{
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    role: import("@prisma/client").$Enums.Role;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
} | null>;
export declare function createUser(data: {
    name: string;
    email: string;
    passwordHash: string;
    role: Role;
}): Promise<UserResponse>;
export declare function updateUser(id: string, data: {
    name?: string;
    role?: Role;
    active?: boolean;
}): Promise<UserResponse>;
//# sourceMappingURL=repository.d.ts.map