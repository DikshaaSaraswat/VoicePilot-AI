
"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { SalesStatusBadge, SourceBadge } from "@/components/shared/badges"
import { getProductName } from "@/lib/demo/demo-data"
import {
  formatCallDate,
  formatDuration,
  LANGUAGE_LABELS,
} from "@/lib/format"
import { cn } from "@/lib/utils"
import type { CallRecord } from "@/lib/types"

interface CallDetailsDialogProps {
  call: CallRecord | null
  onOpenChange: (open: boolean) => void
}

export function CallDetailsDialog({
  call,
  onOpenChange,
}: CallDetailsDialogProps) {
  return (
    <Dialog open={call !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {call && (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle>{call.customerName}</DialogTitle>
                <SourceBadge source={call.source} />
              </div>
              <DialogDescription className="font-mono">
                {call.phone}
              </DialogDescription>
            </DialogHeader>

            <dl className="grid grid-cols-2 gap-4 text-sm">
              <Detail
                label="Product"
                value={getProductName(call.productId)}
              />
              <Detail
                label="Language"
                value={LANGUAGE_LABELS[call.language]}
              />
              <Detail
                label="Date & time"
                value={`${formatCallDate(call.startedAt).date}, ${
                  formatCallDate(call.startedAt).time
                }`}
              />
              <Detail
                label="Duration"
                value={formatDuration(call.durationSeconds)}
                mono
              />

              <div className="col-span-2 flex flex-col gap-1.5">
                <dt className="text-xs text-muted-foreground">
                  Sales status
                </dt>
                <dd>
                  <SalesStatusBadge status={call.salesStatus} />
                </dd>
              </div>
            </dl>

            <Separator />

            <div className="flex flex-col gap-1.5">
              <h3 className="text-xs text-muted-foreground">Summary</h3>
              <p className="text-sm leading-relaxed text-pretty text-foreground">
                {call.summary}
              </p>
            </div>

            {call.transcript && call.transcript.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-xs text-muted-foreground">
                  Transcript ({call.transcript.length} turns)
                </h3>

                <ol className="scrollbar-thin flex max-h-56 flex-col gap-2 overflow-y-auto rounded-lg border border-border bg-muted/20 p-3">
                  {call.transcript.map((message, index) => (
                    <li
                      key={`${call.id}-${message.id || `${message.speaker}-${index}`}`}
                      className="text-sm leading-relaxed"
                    >
                      <span
                        className={cn(
                          "mr-2 font-medium",
                          message.speaker === "agent"
                            ? "text-primary-soft"
                            : "text-foreground",
                        )}
                      >
                        {message.speaker === "agent"
                          ? "AI Agent"
                          : "Customer"}
                      </span>
                      <span className="text-muted-foreground">
                        {message.text}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "text-foreground",
          mono && "font-mono tabular-nums",
        )}
      >
        {value}
      </dd>
    </div>
  )
}

