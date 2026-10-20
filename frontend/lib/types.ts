export type NavSection = "overview" | "new-call" | "history" | "analytics" | "settings"

export type CallStatus = "ready" | "connecting" | "in-call" | "ended"

export type CallLanguage = "auto" | "en" | "hi" | "hinglish"

export const SALES_STATUSES = [
  "Converted",
  "Interested",
  "Follow-up Required",
  "Not Interested",
  "Demo Requested",
  "No Response",
] as const

export type SalesStatus = (typeof SALES_STATUSES)[number]

export type Speaker = "agent" | "customer"

/**
 * Where a piece of data came from.
 * - live: produced by a real backend / voice provider
 * - simulated: produced by the in-browser demo simulation
 * - demo: static seeded sample content
 */
export type DataSource = "live" | "simulated" | "demo"

export interface Product {
  id: string
  name: string
  tagline: string
}

export interface TranscriptMessage {
  id: string
  speaker: Speaker
  text: string
  /** Seconds since the call connected */
  offsetSeconds: number
  source: DataSource
}

export type Sentiment = "Positive" | "Neutral" | "Negative"

export interface CallInsights {
  requirements: string[]
  objections: string[]
  sentiment: Sentiment
  sentimentScore: number
  nextSteps: string[]
  followUpDate: string
  summary: string
  salesStatus: SalesStatus
  source: DataSource
}

export interface CallRecord {
  id: string
  customerName: string
  phone: string
  productId: string
  language: CallLanguage
  startedAt: string
  durationSeconds: number
  salesStatus: SalesStatus
  summary: string
  recordingUrl: string | null
  source: DataSource
  transcript?: TranscriptMessage[]
  insights?: CallInsights
}

export interface CallFormValues {
  productId: string
  customerName: string
  phone: string
  language: CallLanguage
}

export type CallFormErrors = Partial<Record<"customerName" | "phone", string>>

export type MicPermission =
  | "unknown"
  | "prompt"
  | "granted"
  | "denied"
  | "unsupported"
  | "no-device"
  | "error"
