import { API } from './endpoints'

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  token?: string | null
}

export interface ApiErrorShape {
  message: string
  status: number
  data?: unknown
}

export class ApiError extends Error implements ApiErrorShape {
  status: number
  data?: unknown

  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.status = status
    this.data = data
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, token, ...rest } = options

  const requestHeaders = new Headers(headers)
  requestHeaders.set('Accept', 'application/json')
  if (!(body instanceof FormData)) {
    requestHeaders.set('Content-Type', 'application/json')
  }
  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API.baseUrl}${path}`, {
    ...rest,
    headers: requestHeaders,
    body: body == null ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  })

  const contentType = response.headers.get('content-type') ?? ''
  const data = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
    const message =
      typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string'
        ? data.message
        : `Request failed with status ${response.status}`
    throw new ApiError(message, response.status, data)
  }

  return data as T
}

export const authTokenStorage = {
  key: 'alavia.authToken',
  get() {
    return localStorage.getItem(this.key)
  },
  set(token: string) {
    localStorage.setItem(this.key, token)
  },
  clear() {
    localStorage.removeItem(this.key)
  },
}

