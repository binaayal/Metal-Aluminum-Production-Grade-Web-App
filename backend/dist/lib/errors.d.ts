/**
 * Application error classes matching the standard error envelope:
 * { error: { code: string, message: string, fields?: Record<string, string> } }
 */
export declare class AppError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly fields?: Record<string, string>;
    constructor(code: string, message: string, statusCode: number, fields?: Record<string, string>);
    toJSON(): {
        error: {
            fields?: Record<string, string> | undefined;
            code: string;
            message: string;
        };
    };
}
export declare class ValidationError extends AppError {
    constructor(message: string, fields?: Record<string, string>);
}
export declare class NotFoundError extends AppError {
    constructor(resource: string, id?: string);
}
export declare class ConflictError extends AppError {
    constructor(message?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
//# sourceMappingURL=errors.d.ts.map