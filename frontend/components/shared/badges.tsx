import { FlaskConical, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { SALES_STATUS_DOT, SALES_STATUS_STYLES } from "@/lib/status"
import type { DataSource, SalesStatus } from "@/lib/types"

export function SourceBadge({ source, className }: { source: DataSource; className?: string }) {
  if (source === "live") return null
  const isSimulated = source === "simulated"
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 border-dashed font-mono text-[10px] uppercase tracking-wider",
        isSimulated ? "border-info/40 text-info" : "border-warning/40 text-warning",
        className,
      )}
    >
      {isSimulated ? <Sparkles aria-hidden="true" /> : <FlaskConical aria-hidden="true" />}
      {isSimulated ? "Simulated" : "Demo data"}
    </Badge>
  )
}

export function SalesStatusBadge({ status, className }: { status: SalesStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-medium", SALES_STATUS_STYLES[status], className)}>
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", SALES_STATUS_DOT[status])} />
      {status}
    </Badge>
  )
}

export function LiveDot({ className, pulse = true }: { className?: string; pulse?: boolean }) {
  return (
    <span aria-hidden="true" className="relative inline-flex size-2">
      {pulse && <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-60", className)} />}
      <span className={cn("relative inline-flex size-2 rounded-full", className)} />
    </span>
  )
}
