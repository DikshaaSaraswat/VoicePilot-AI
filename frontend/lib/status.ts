import type { CallStatus, SalesStatus } from "./types"

export const SALES_STATUS_STYLES: Record<SalesStatus, string> = {
  Converted: "border-success/25 bg-success/10 text-success",
  Interested: "border-primary/30 bg-primary/12 text-primary-soft",
  "Follow-up Required": "border-warning/25 bg-warning/10 text-warning",
  "Not Interested": "border-destructive/25 bg-destructive/10 text-destructive",
  "Demo Requested": "border-info/25 bg-info/10 text-info",
  "No Response": "border-border bg-muted text-muted-foreground",
}

export const SALES_STATUS_DOT: Record<SalesStatus, string> = {
  Converted: "bg-success",
  Interested: "bg-primary-soft",
  "Follow-up Required": "bg-warning",
  "Not Interested": "bg-destructive",
  "Demo Requested": "bg-info",
  "No Response": "bg-muted-foreground",
}

export const CALL_STATUS_META: Record<CallStatus, { label: string; dot: string; text: string }> = {
  ready: { label: "Ready", dot: "bg-success", text: "text-success" },
  connecting: { label: "Connecting", dot: "bg-warning", text: "text-warning" },
  "in-call": { label: "In Call", dot: "bg-info", text: "text-info" },
  ended: { label: "Ended", dot: "bg-muted-foreground", text: "text-muted-foreground" },
}
