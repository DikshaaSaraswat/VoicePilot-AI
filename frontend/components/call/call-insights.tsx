"use client"

import {
  AlertTriangle,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  CloudUpload,
  Gauge,
  ListChecks,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { SalesStatusBadge, SourceBadge } from "@/components/shared/badges"
import { cn } from "@/lib/utils"
import { SALES_STATUSES, type CallInsights, type CallStatus, type SalesStatus } from "@/lib/types"

const SALES_STATUS_ITEMS = SALES_STATUSES.map((status) => ({ value: status, label: status }))

const SENTIMENT_STYLES: Record<CallInsights["sentiment"], { bar: string; text: string }> = {
  Positive: { bar: "bg-success", text: "text-success" },
  Neutral: { bar: "bg-warning", text: "text-warning" },
  Negative: { bar: "bg-destructive", text: "text-destructive" },
}

interface CallInsightsCardProps {
  status: CallStatus
  insights: CallInsights | null
  onChange: (patch: Partial<CallInsights>) => void
  onSave: () => void
  isSaving: boolean
}

export function CallInsightsCard({ status, insights, onChange, onSave, isSaving }: CallInsightsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BrainCircuit className="size-4 text-primary-soft" aria-hidden="true" />
          AI Call Intelligence
        </CardTitle>
        <CardDescription>Post-call analysis, objections, and next best actions.</CardDescription>
        {insights && (
          <CardAction className="flex items-center gap-2">
            <SourceBadge source={insights.source} />
            <SalesStatusBadge status={insights.salesStatus} className="hidden sm:inline-flex" />
          </CardAction>
        )}
      </CardHeader>

      {!insights ? (
        <CardContent>
          <Empty className="border border-dashed border-border bg-muted/20 py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                {status === "connecting" || status === "in-call" ? <Spinner /> : <BrainCircuit />}
              </EmptyMedia>
              <EmptyTitle>
                {status === "in-call" || status === "connecting" ? "Listening to the conversation..." : "No call analyzed yet"}
              </EmptyTitle>
              <EmptyDescription>
                {status === "in-call" || status === "connecting"
                  ? "Insights are generated as soon as the call ends."
                  : "End a call to see customer requirements, objections, sentiment, and a recommended follow-up plan."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      ) : (
        <>
          <CardContent className="flex flex-col gap-6">
            {insights.source === "simulated" && (
              <p className="rounded-lg border border-dashed border-info/30 bg-info/5 px-3 py-2 text-xs text-info">
                Generated from the scripted simulation for UI demonstration — not real AI analysis. Connect the backend to
                use live insights.
              </p>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <InsightList icon={ClipboardList} title="Customer requirements" items={insights.requirements} />
              <InsightList icon={AlertTriangle} title="Main objections" items={insights.objections} tone="warning" />
              <SentimentTile insights={insights} />
              <InsightList icon={ListChecks} title="Recommended next steps" items={insights.nextSteps} tone="success" />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
              <Field>
                <FieldLabel htmlFor="call-summary">Call summary</FieldLabel>
                <Textarea
                  id="call-summary"
                  rows={5}
                  value={insights.summary}
                  onChange={(event) => onChange({ summary: event.target.value })}
                  className="min-h-32 resize-y leading-relaxed"
                />
                <FieldDescription>AI-generated draft. Edit before saving to your CRM.</FieldDescription>
              </Field>

              <div className="flex flex-col gap-4">
                <Field>
                  <FieldLabel htmlFor="sales-status">Sales status</FieldLabel>
                  <Select
                    items={SALES_STATUS_ITEMS}
                    value={insights.salesStatus}
                    onValueChange={(value) => {
                      if (value) onChange({ salesStatus: value as SalesStatus })
                    }}
                  >
                    <SelectTrigger id="sales-status" className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {SALES_STATUS_ITEMS.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="follow-up-date" className="flex items-center gap-1.5">
                    <CalendarClock className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    Suggested follow-up
                  </FieldLabel>
                  <Input
                    id="follow-up-date"
                    type="date"
                    className="h-10 [color-scheme:dark]"
                    value={insights.followUpDate}
                    onChange={(event) => onChange({ followUpDate: event.target.value })}
                  />
                </Field>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-3 border-t border-border sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Saving sends this call log to your FastAPI backend. Nothing is saved if the backend is unreachable.
            </p>
            <Button onClick={onSave} disabled={isSaving} className="shrink-0">
              {isSaving ? <Spinner data-icon="inline-start" /> : <CloudUpload data-icon="inline-start" />}
              {isSaving ? "Saving..." : "Save to backend"}
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  )
}

function InsightList({
  icon: Icon,
  title,
  items,
  tone = "primary",
}: {
  icon: LucideIcon
  title: string
  items: string[]
  tone?: "primary" | "warning" | "success"
}) {
  const toneClass = tone === "warning" ? "text-warning" : tone === "success" ? "text-success" : "text-primary-soft"
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4">
      <h3 className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className={cn("size-3.5", toneClass)} aria-hidden="true" />
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">None identified.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item} className="flex gap-2 text-sm leading-relaxed text-foreground">
              <CheckCircle2 className={cn("mt-0.5 size-3.5 shrink-0", toneClass)} aria-hidden="true" />
              <span className="text-pretty">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function SentimentTile({ insights }: { insights: CallInsights }) {
  const style = SENTIMENT_STYLES[insights.sentiment]
  const score = Math.max(0, Math.min(100, Math.round(insights.sentimentScore)))
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4">
      <h3 className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <Gauge className={cn("size-3.5", style.text)} aria-hidden="true" />
        Customer sentiment
      </h3>
      <div className="flex items-baseline gap-2">
        <span className={cn("text-2xl font-semibold", style.text)}>{insights.sentiment}</span>
        <span className="font-mono text-sm text-muted-foreground tabular-nums">{score}/100</span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="meter"
        aria-label="Sentiment score"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
      >
        <div className={cn("h-full rounded-full transition-all", style.bar)} style={{ width: `${score}%` }} />
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Based on tone, engagement, and buying signals across the conversation.
      </p>
    </section>
  )
}
