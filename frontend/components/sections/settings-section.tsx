"use client"

import useSWR from "swr"
import { CheckCircle2, CircleDashed, PlugZap, RefreshCw, Server, XCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { API_BASE_URL, describeApiError } from "@/lib/api/client"
import { callsApi } from "@/lib/api/calls"

const ENDPOINTS = [
  ["GET", "/health"],
  ["POST", "/api/calls/start"],
  ["POST", "/api/calls/{id}/end"],
  ["GET", "/api/calls"],
  ["GET", "/api/calls/{id}/insights"],
  ["PATCH", "/api/calls/{id}"],
  ["POST", "/api/calls/logs"],
  ["GET", "/api/calls/{id}/recording"],
] as const

export function SettingsSection() {
  const { data, error, isLoading, isValidating, mutate } = useSWR("backend-health", callsApi.health, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Server className="size-4 text-primary-soft" aria-hidden="true" />
            Backend connection
          </CardTitle>
          <CardDescription>FastAPI service used for calls, insights, and recordings.</CardDescription>
          <CardAction>
            <Button variant="outline" size="sm" onClick={() => mutate()} disabled={isValidating}>
              <RefreshCw data-icon="inline-start" className={isValidating ? "animate-spin" : undefined} />
              Retry
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">NEXT_PUBLIC_API_URL</span>
            <code className="rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-sm text-foreground">
              {API_BASE_URL}
            </code>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <XCircle />
              <AlertTitle>Backend unreachable</AlertTitle>
              <AlertDescription>
                {describeApiError(error)} The dashboard keeps working in simulation mode until the backend is running.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-success/30 bg-success/5">
              <CheckCircle2 className="text-success" />
              <AlertTitle className="text-success">Connected</AlertTitle>
              <AlertDescription>
                Health check returned &quot;{data?.status}&quot;{data?.version ? ` · v${data.version}` : ""}.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PlugZap className="size-4 text-primary-soft" aria-hidden="true" />
            Integrations
          </CardTitle>
          <CardDescription>Provider credentials stay on the backend — never in this frontend.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <IntegrationRow name="Voice provider" detail="Telephony + streaming audio" />
          <IntegrationRow name="Speech-to-text" detail="Live transcript stream" />
          <IntegrationRow name="LLM analysis" detail="Post-call insights" />
          <IntegrationRow name="Recording storage" detail="Audio files served by backend" />
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Expected API contract</CardTitle>
          <CardDescription>
            Defined in <code className="font-mono text-xs">lib/api/calls.ts</code>. Adjust paths there to match your
            FastAPI routes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {ENDPOINTS.map(([method, path]) => (
              <li key={`${method}-${path}`} className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2">
                <span className="w-12 font-mono text-[11px] font-semibold text-info">{method}</span>
                <code className="truncate font-mono text-sm text-foreground">{path}</code>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

function IntegrationRow({ name, detail }: { name: string; detail: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2.5">
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-medium text-foreground">{name}</span>
        <span className="truncate text-xs text-muted-foreground">{detail}</span>
      </div>
      <Badge variant="outline" className="shrink-0 gap-1 text-muted-foreground">
        <CircleDashed aria-hidden="true" />
        Via backend
      </Badge>
    </div>
  )
}
