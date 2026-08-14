export interface SessionUser {
    id: string;
    name: string;
    email: string;
    role: string;
    active: boolean;
}
export declare function authenticateUser(email: string, password: string): Promise<SessionUser>;
export declare function getUserById(id: string): Promise<SessionUser | null>;
//# sourceMappingURL=service.d.ts.map