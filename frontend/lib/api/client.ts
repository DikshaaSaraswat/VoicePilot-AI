
const DEFAULT_API_URL = "http://127.0.0.1:8000"

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL
).replace(/\/+$/, "")

export function getVoiceWebSocketUrl(): string {
  const url = new URL(API_BASE_URL)

  url.protocol = url.protocol === "https:" ? "wss:" : "ws:"
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/ws/voice`
  url.search = ""
  url.hash = ""

  return url.toString()
}

export type ApiErrorKind = "network" | "timeout" | "http" | "parse"

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | null

  constructor(
    message: string,
    kind: ApiErrorKind,
    status: number | null = null,
  ) {
    super(message)
    this.name = "ApiError"
    this.kind = kind
    this.status = status
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown
  timeoutMs?: number
}

/**
 * Thin fetch wrapper for the FastAPI backend.
 * It never fabricates responses: any failure surfaces as an ApiError.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, timeoutMs = 10_000, headers, ...init } = options
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(
        `Request timed out after ${timeoutMs / 1000}s`,
        "timeout",
      )
    }

    throw new ApiError(
      `Could not reach the backend at ${API_BASE_URL}`,
      "network",
    )
  } finally {
    clearTimeout(timer)
  }

  if (!response.ok) {
    let detail = response.statusText

    try {
      const payload = (await response.json()) as { detail?: unknown }

      if (typeof payload.detail === "string") {
        detail = payload.detail
      }
    } catch {
      // Non-JSON error body; keep the status text.
    }

    throw new ApiError(
      detail || `Request failed with status ${response.status}`,
      "http",
      response.status,
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  try {
    return (await response.json()) as T
  } catch {
    throw new ApiError(
      "Backend returned an invalid JSON response",
      "parse",
      response.status,
    )
  }
}

export function describeApiError(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return "Unexpected error"
}
