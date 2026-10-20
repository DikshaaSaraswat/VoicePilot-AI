
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCards } from "@/components/dashboard/metric-cards"
import { formatDuration, LANGUAGE_LABELS } from "@/lib/format"
import { SALES_STATUS_DOT } from "@/lib/status"
import { cn } from "@/lib/utils"
import { SALES_STATUSES, type CallLanguage, type CallRecord } from "@/lib/types"

export function AnalyticsSection({ calls }: { calls: CallRecord[] }) {
  const total = calls.length

  const statusCounts = SALES_STATUSES.map((status) => ({
    status,
    count: calls.filter((call) => call.salesStatus === status).length,
  }))

  const languageCounts = (Object.keys(LANGUAGE_LABELS) as CallLanguage[]).map((language) => ({
    language,
    count: calls.filter((call) => call.language === language).length,
  }))

  const avgDuration = total
    ? Math.round(
        calls.reduce((sum, call) => sum + call.durationSeconds, 0) / total,
      )
    : 0

  const maxStatus = Math.max(1, ...statusCounts.map((item) => item.count))

  return (
    <div className="flex flex-col gap-6">
      <MetricCards />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Outcome breakdown</CardTitle>
            <CardDescription>
              {total} calls in this workspace · average {formatDuration(avgDuration)}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <ul className="flex flex-col gap-4">
              {statusCounts.map(({ status, count }) => (
                <li key={status} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-foreground">
                      <span
                        aria-hidden="true"
                        className={cn("size-2 rounded-full", SALES_STATUS_DOT[status])}
                      />
                      {status}
                    </span>

                    <span className="font-mono text-muted-foreground tabular-nums">
                      {count}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        SALES_STATUS_DOT[status],
                      )}
                      style={{ width: `${(count / maxStatus) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Language mix</CardTitle>
            <CardDescription>
              Share of calls by conversation language
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-3">
            {languageCounts.map(({ language, count }) => {
              const share = total ? Math.round((count / total) * 100) : 0

              return (
                <div
                  key={language}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2.5"
                >
                  <span className="text-sm text-foreground">
                    {LANGUAGE_LABELS[language]}
                  </span>

                  <span className="font-mono text-sm text-muted-foreground tabular-nums">
                    {share}%
                  </span>
                </div>
              )
            })}

            <p className="pt-1 text-xs text-muted-foreground">
              Computed in the browser from the demo and simulated calls listed in Call History.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

