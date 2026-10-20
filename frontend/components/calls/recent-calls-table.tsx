
"use client"

import { Eye, Play, Search, SearchX } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SalesStatusBadge, SourceBadge } from "@/components/shared/badges"
import { formatCallDate, formatDuration, initials } from "@/lib/format"
import { SALES_STATUSES, type CallRecord, type SalesStatus } from "@/lib/types"

export type StatusFilter = SalesStatus | "all"

const FILTER_ITEMS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  ...SALES_STATUSES.map((status) => ({ value: status, label: status })),
]

interface RecentCallsTableProps {
  calls: CallRecord[]
  query: string
  onQueryChange: (query: string) => void
  statusFilter: StatusFilter
  onStatusFilterChange: (status: StatusFilter) => void
  onView: (call: CallRecord) => void
  onPlay: (call: CallRecord) => void
  limit?: number
  title?: string
}

export function filterCalls(
  calls: CallRecord[],
  query: string,
  status: StatusFilter,
) {
  const q = query.trim().toLowerCase()

  return calls.filter((call) => {
    if (status !== "all" && call.salesStatus !== status) return false
    if (!q) return true

    return (
      call.customerName.toLowerCase().includes(q) ||
      call.phone.replace(/\s/g, "").includes(q.replace(/\s/g, "")) ||
      call.summary.toLowerCase().includes(q)
    )
  })
}

export function RecentCallsTable({
  calls,
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  onView,
  onPlay,
  limit,
  title = "Recent Calls",
}: RecentCallsTableProps) {
  const filtered = filterCalls(calls, query, statusFilter)
  const visible = limit ? filtered.slice(0, limit) : filtered

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>
          {filtered.length} {filtered.length === 1 ? "call" : "calls"}
          {query || statusFilter !== "all"
            ? " match your filters"
            : " in this workspace"}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <InputGroup className="h-9 sm:max-w-xs">
            <InputGroupAddon>
              <Search aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search name, phone, or summary"
              aria-label="Search calls"
            />
          </InputGroup>

          <Select
            items={FILTER_ITEMS}
            value={statusFilter}
            onValueChange={(value) => {
              if (value) onStatusFilterChange(value as StatusFilter)
            }}
          >
            <SelectTrigger
              className="h-9 w-full sm:w-52"
              aria-label="Filter by sales status"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {FILTER_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {visible.length === 0 ? (
          <Empty className="border border-dashed border-border py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchX />
              </EmptyMedia>
              <EmptyTitle>No calls found</EmptyTitle>
              <EmptyDescription>
                Try a different search term or clear the status filter.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="min-w-48">Customer</TableHead>
                  <TableHead className="min-w-36">Date &amp; time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="min-w-40">Status</TableHead>
                  <TableHead className="hidden min-w-64 lg:table-cell">
                    Summary
                  </TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {visible.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="bg-muted text-[11px] font-medium">
                            {initials(call.customerName)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex min-w-0 flex-col">
                          <span className="flex items-center gap-1.5 truncate font-medium text-foreground">
                            {call.customerName}
                            {call.source === "simulated" && (
                              <SourceBadge
                                source="simulated"
                                className="h-4 px-1"
                              />
                            )}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {call.phone}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-foreground">
                          {formatCallDate(call.startedAt).date}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatCallDate(call.startedAt).time}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="font-mono tabular-nums">
                      {formatDuration(call.durationSeconds)}
                    </TableCell>

                    <TableCell>
                      <SalesStatusBadge status={call.salesStatus} />
                    </TableCell>

                    <TableCell className="hidden max-w-80 lg:table-cell">
                      <p className="truncate text-muted-foreground">
                        {call.summary}
                      </p>
                    </TableCell>

                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => onView(call)}
                                aria-label={`View details for ${call.customerName}`}
                              >
                                <Eye />
                              </Button>
                            }
                          />
                          <TooltipContent>View details</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => onPlay(call)}
                                aria-label={`Play recording for ${call.customerName}`}
                              >
                                <Play />
                              </Button>
                            }
                          />
                          <TooltipContent>Play recording</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
