import type { CallRecord, Product } from "@/lib/types"

export const PRODUCTS: Product[] = [
  { id: "taskflow-ai", name: "TaskFlow AI", tagline: "AI task automation for growing teams" },
  { id: "clouddesk-crm", name: "CloudDesk CRM", tagline: "Lightweight CRM for SMB sales teams" },
  { id: "insighthub", name: "InsightHub Analytics", tagline: "Self-serve business dashboards" },
]

export function getProductName(productId: string) {
  return PRODUCTS.find((product) => product.id === productId)?.name ?? productId
}

/** Seeded sample records for UI demonstration only. Not real customers or calls. */
export const DEMO_CALLS: CallRecord[] = [
  {
    id: "demo-1042",
    customerName: "Priya Sharma",
    phone: "+91 98765 43210",
    productId: "taskflow-ai",
    language: "hinglish",
    startedAt: "2026-10-20T10:42:00+05:30",
    durationSeconds: 284,
    salesStatus: "Demo Requested",
    summary:
      "Ops lead at a 30-person agency. Tracks work in spreadsheets; wants auto-assignment and Slack alerts. Asked for a Thursday demo.",
    recordingUrl: null,
    source: "demo",
  },
  {
    id: "demo-1041",
    customerName: "Rahul Verma",
    phone: "+91 99887 66554",
    productId: "clouddesk-crm",
    language: "en",
    startedAt: "2026-10-20T09:15:00+05:30",
    durationSeconds: 412,
    salesStatus: "Converted",
    summary:
      "Agreed to the annual Growth plan for 12 seats after confirming WhatsApp integration and data migration support.",
    recordingUrl: null,
    source: "demo",
  },
  {
    id: "demo-1040",
    customerName: "Ananya Iyer",
    phone: "+91 90123 45678",
    productId: "insighthub",
    language: "en",
    startedAt: "2026-10-19T17:30:00+05:30",
    durationSeconds: 196,
    salesStatus: "Follow-up Required",
    summary: "Interested in finance dashboards but needs sign-off from the CFO. Requested a call back next week.",
    recordingUrl: null,
    source: "demo",
  },
  {
    id: "demo-1039",
    customerName: "Vikram Singh",
    phone: "+91 98111 22334",
    productId: "taskflow-ai",
    language: "hi",
    startedAt: "2026-10-19T14:05:00+05:30",
    durationSeconds: 88,
    salesStatus: "Not Interested",
    summary: "Already using an in-house tool and not evaluating alternatives this quarter.",
    recordingUrl: null,
    source: "demo",
  },
  {
    id: "demo-1038",
    customerName: "Sneha Patel",
    phone: "+91 97654 32109",
    productId: "clouddesk-crm",
    language: "hinglish",
    startedAt: "2026-10-19T11:20:00+05:30",
    durationSeconds: 263,
    salesStatus: "Interested",
    summary: "Liked the pipeline view. Concerned about onboarding time for a non-technical team; wants case studies.",
    recordingUrl: null,
    source: "demo",
  },
  {
    id: "demo-1037",
    customerName: "Arjun Mehta",
    phone: "+91 93456 78901",
    productId: "insighthub",
    language: "en",
    startedAt: "2026-10-18T16:48:00+05:30",
    durationSeconds: 0,
    salesStatus: "No Response",
    summary: "Call was not answered. Retry scheduled for a weekday morning.",
    recordingUrl: null,
    source: "demo",
  },
  {
    id: "demo-1036",
    customerName: "Kavya Reddy",
    phone: "+91 91234 56780",
    productId: "taskflow-ai",
    language: "en",
    startedAt: "2026-10-18T12:10:00+05:30",
    durationSeconds: 337,
    salesStatus: "Interested",
    summary: "Evaluating tools for a 50-person support team. Wants SSO and audit logs before a pilot.",
    recordingUrl: null,
    source: "demo",
  },
]

export const DEMO_METRICS = [
  { id: "total", label: "Total Calls", value: "128", delta: "+12.4%", trend: "up", comparison: "vs last week" },
  { id: "leads", label: "Interested Leads", value: "42", delta: "+8.1%", trend: "up", comparison: "vs last week" },
  { id: "conversion", label: "Conversion Rate", value: "18.7%", delta: "+2.3 pts", trend: "up", comparison: "vs last week" },
  { id: "duration", label: "Avg. Call Duration", value: "03:42", delta: "-0:14", trend: "down", comparison: "vs last week" },
] as const
