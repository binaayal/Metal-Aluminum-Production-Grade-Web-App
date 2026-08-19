/**
 * Application error classes matching the standard error envelope:
 * { error: { code: string, message: string, fields?: Record<string, string> } }
 */

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly fields?: Record<string, string>;

  constructor(code: string, message: string, statusCode: number, fields?: Record<string, string>) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.fields = fields;
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.fields && { fields: this.fields }),
      },
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, fields?: Record<string, string>) {
    super('VALIDATION_ERROR', message, 400, fields);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super('NOT_FOUND', id ? `${resource} with id '${id}' not found` : `${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource was modified by another user. Please refresh and try again.') {
    super('CONFLICT', message, 409);
    this.name = 'ConflictError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action.') {
    super('FORBIDDEN', message, 403);
    this.name = 'ForbiddenError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required.') {
    super('UNAUTHORIZED', message, 401);
    this.name = 'UnauthorizedError';
  }
}
