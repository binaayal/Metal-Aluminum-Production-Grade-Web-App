import type { UserResponse } from './types.js';
export declare function listUsers(): Promise<UserResponse[]>;
export declare function createUser(data: {
    name: string;
    email: string;
    password: string;
    role: string;
}): Promise<UserResponse>;
export declare function updateUser(id: string, data: {
    name?: string;
    role?: string;
    active?: boolean;
}): Promise<UserResponse>;
//# sourceMappingURL=service.d.ts.map