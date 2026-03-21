import { z } from 'zod'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function parseError(response: Response) {
  try {
    const payload = await response.json()

    if (payload && typeof payload === 'object' && 'detail' in payload && typeof payload.detail === 'string') {
      return payload.detail
    }
  } catch {
    // ignore parse failure and fall back to status text
  }

  return response.statusText || 'Request failed'
}

export async function fetchJson<T>(
  input: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    headers: {
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!response.ok) {
    const message = await parseError(response)
    throw new ApiError(message, response.status)
  }

  const payload = await response.json()
  return schema.parse(payload)
}
