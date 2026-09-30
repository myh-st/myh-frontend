/**
 * BACKEND CONTRACT: request helpers shared by all API modules.
 * Do not change error codes or request shapes without a backend change.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    throw new ApiError(res.status, data?.code ?? 'UNKNOWN', data?.message ?? `HTTP ${res.status}`);
  }
  return data as T;
}

export async function get<T>(url: string): Promise<T> {
  return parse<T>(await fetch(url, { credentials: 'include' }));
}

export async function send<T>(method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', url: string, body?: unknown): Promise<T> {
  return parse<T>(
    await fetch(url, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
}
