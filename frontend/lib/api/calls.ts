import { API_BASE_URL, apiRequest } from "./client"
import type { CallInsights, CallLanguage, CallRecord, SalesStatus, TranscriptMessage } from "@/lib/types"

/**
 * API contract expected from the FastAPI backend.
 * Adjust paths here only — UI components never call fetch directly.
 */

export interface HealthResponse {
  status: string
  version?: string
}

export interface StartCallRequest {
  product_id: string
  customer_name: string
  phone_number: string
  language: CallLanguage
}

export interface StartCallResponse {
  call_id: string
  status: "connecting" | "in_call"
}

export interface CallLogRequest {
  customer_name: string
  phone_number: string
  product_id: string
  language: CallLanguage
  started_at: string
  duration_seconds: number
  sales_status: SalesStatus
  summary: string
  transcript: Array<Pick<TranscriptMessage, "speaker" | "text" | "offsetSeconds">>
  is_simulated: boolean
}

export interface CallUpdateRequest {
  sales_status?: SalesStatus
  summary?: string
}

export const callsApi = {
  health: () => apiRequest<HealthResponse>("/health", { timeoutMs: 5_000 }),

  startCall: (payload: StartCallRequest) =>
    apiRequest<StartCallResponse>("/api/calls/start", { method: "POST", body: payload }),

  endCall: (callId: string) =>
    apiRequest<{ call_id: string; duration_seconds: number }>(`/api/calls/${encodeURIComponent(callId)}/end`, {
      method: "POST",
    }),

  listCalls: () => apiRequest<CallRecord[]>("/api/calls"),

  getCall: (callId: string) => apiRequest<CallRecord>(`/api/calls/${encodeURIComponent(callId)}`),

  getInsights: (callId: string) =>
    apiRequest<CallInsights>(`/api/calls/${encodeURIComponent(callId)}/insights`, { timeoutMs: 30_000 }),

  updateCall: (callId: string, payload: CallUpdateRequest) =>
    apiRequest<CallRecord>(`/api/calls/${encodeURIComponent(callId)}`, { method: "PATCH", body: payload }),

  saveCallLog: (payload: CallLogRequest) =>
    apiRequest<{ id: string }>("/api/calls/logs", { method: "POST", body: payload }),

  recordingUrl: (callId: string) => `${API_BASE_URL}/api/calls/${encodeURIComponent(callId)}/recording`,
}
