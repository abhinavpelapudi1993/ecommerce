export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export abstract class BaseClient {
  constructor(protected readonly baseUrl: string) {}

  protected async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}) as Record<string, string>);
      throw new ApiError(response.status, (body as Record<string, string>).message || response.statusText);
    }
    return response.json() as Promise<T>;
  }

  protected async post<T, B = unknown>(path: string, body: B, options?: { headers?: Record<string, string> }): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}) as Record<string, string>);
      throw new ApiError(response.status, (errBody as Record<string, string>).message || response.statusText);
    }
    return response.json() as Promise<T>;
  }

  protected async delete(path: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}${path}`, { method: 'DELETE' });
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}) as Record<string, string>);
      throw new ApiError(response.status, (errBody as Record<string, string>).message || response.statusText);
    }
  }

  protected async patch<T, B = unknown>(path: string, body: B, options?: { headers?: Record<string, string> }): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}) as Record<string, string>);
      throw new ApiError(response.status, (errBody as Record<string, string>).message || response.statusText);
    }
    return response.json() as Promise<T>;
  }
}
