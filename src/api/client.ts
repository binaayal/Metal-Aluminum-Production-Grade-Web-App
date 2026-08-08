// Real API Client — replaces mock wrapper with actual HTTP fetch calls.
// Uses credentials: 'include' for session cookie per full-stack-design §1.5.

export interface ApiError {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

export class ApiRequestError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly fields?: Record<string, string>;

  constructor(error: ApiError, statusCode: number) {
    super(error.message);
    this.name = 'ApiRequestError';
    this.code = error.code;
    this.statusCode = statusCode;
    this.fields = error.fields;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json();

  if (!response.ok) {
    if (data?.error) {
      throw new ApiRequestError(data.error, response.status);
    }
    throw new ApiRequestError(
      { code: 'UNKNOWN_ERROR', message: `Request failed with status ${response.status}` },
      response.status
    );
  }

  return data as T;
}

export async function apiGet<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
  const url = new URL(path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, value);
      }
    });
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  });

  return handleResponse<T>(response);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return handleResponse<T>(response);
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return handleResponse<T>(response);
}
