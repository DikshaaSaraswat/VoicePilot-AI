
import {
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Percent,
  PhoneCall,
  UserCheck,
  type LucideIcon,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { DEMO_METRICS } from "@/lib/demo/demo-data"
import { cn } from "@/lib/utils"

const ICONS: Record<(typeof DEMO_METRICS)[number]["id"], LucideIcon> = {
  total: PhoneCall,
  leads: UserCheck,
  conversion: Percent,
  duration: Clock,
}

export function MetricCards() {
  return (
    <section aria-labelledby="metrics-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2
          id="metrics-heading"
          className="text-sm font-medium text-muted-foreground"
        >
          This week at a glance
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {DEMO_METRICS.map((metric) => {
          const Icon = ICONS[metric.id]
          const isUp = metric.trend === "up"

          return (
            <Card key={metric.id} className="gap-0 p-4 md:p-5">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground md:text-sm">
                  {metric.label}
                </span>

                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/60">
                  <Icon
                    className="size-4 text-primary-soft"
                    aria-hidden="true"
                  />
                </span>
              </div>

              <p className="mt-3 font-mono text-2xl font-semibold tracking-tight text-foreground tabular-nums md:text-3xl">
                {metric.value}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium",
                    isUp
                      ? "bg-success/10 text-success"
                      : "bg-info/10 text-info",
                  )}
                >
                  {isUp ? (
                    <ArrowUpRight className="size-3" aria-hidden="true" />
                  ) : (
                    <ArrowDownRight className="size-3" aria-hidden="true" />
                  )}
                  {metric.delta}
                </span>

                <span className="text-muted-foreground">
                  {metric.comparison}
                </span>
              </div>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
