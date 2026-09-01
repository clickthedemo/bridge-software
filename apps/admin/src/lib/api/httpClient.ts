import { env } from '../../config/env'

type ApiErrorBody = {
  error?: string
  message?: string
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

type RequestOptions = RequestInit & {
  accessToken?: string
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { accessToken, headers, ...requestOptions } = options

  let response: Response
  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      ...requestOptions,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    })
  } catch {
    throw new ApiError('Unable to reach the BRIDGE API. Please try again shortly.', 0)
  }

  const body = (await response.json().catch(() => ({}))) as T & ApiErrorBody

  if (!response.ok) {
    throw new ApiError(
      body.message ?? 'The request could not be completed.',
      response.status,
      body.error,
    )
  }

  return body
}
