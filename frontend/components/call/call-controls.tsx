
"use client"

import {
  Info,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  RotateCcw,
  ShieldAlert,
  Timer,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { VoiceOrb } from "@/components/call/voice-orb"
import { PRODUCTS } from "@/lib/demo/demo-data"
import { formatDuration, LANGUAGE_LABELS } from "@/lib/format"
import { CALL_STATUS_META } from "@/lib/status"
import { cn } from "@/lib/utils"
import type {
  CallFormErrors,
  CallFormValues,
  CallLanguage,
  CallStatus,
  MicPermission,
} from "@/lib/types"

const PRODUCT_ITEMS = PRODUCTS.map((product) => ({
  value: product.id,
  label: product.name,
}))

const LANGUAGE_ITEMS = (
  Object.keys(LANGUAGE_LABELS) as CallLanguage[]
).map((value) => ({
  value,
  label: LANGUAGE_LABELS[value],
}))

interface CallControlsProps {
  values: CallFormValues
  errors: CallFormErrors
  onChange: (patch: Partial<CallFormValues>) => void
  status: CallStatus
  elapsed: number
  micPermission: MicPermission
  micActive: boolean
  micLevel: number
  agentSpeaking: boolean
  recordingConsent: boolean
  onRecordingConsentChange: (checked: boolean) => void
  onStart: () => void
  onEnd: () => void
  onReset: () => void
}

export function CallControls({
  values,
  errors,
  onChange,
  status,
  elapsed,
  micPermission,
  micActive,
  micLevel,
  agentSpeaking,
  recordingConsent,
  onRecordingConsentChange,
  onStart,
  onEnd,
  onReset,
}: CallControlsProps) {
  const isActive =
    status === "connecting" || status === "in-call"
  const meta = CALL_STATUS_META[status]

  return (
    <Card className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
      />

      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">
              Start a Conversation
            </CardTitle>
            <CardDescription>
              Configure the AI agent and start a voice conversation.
              No real customer is dialed.
            </CardDescription>
          </div>

          <div
            role="status"
            aria-live="polite"
            className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-muted/50 px-2.5 py-1"
          >
            <span
              aria-hidden="true"
              className={cn(
                "size-2 rounded-full",
                meta.dot,
                isActive && "animate-pulse",
              )}
            />
            <span className={cn("text-xs font-medium", meta.text)}>
              <span className="sr-only">Call status: </span>
              {meta.label}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            if (!isActive) onStart()
          }}
          className="flex flex-col gap-6"
        >
          <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="product">Product</FieldLabel>
              <Select
                items={PRODUCT_ITEMS}
                value={values.productId}
                onValueChange={(value) => {
                  if (value) {
                    onChange({ productId: value as string })
                  }
                }}
                disabled={isActive}
              >
                <SelectTrigger id="product" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {PRODUCT_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field data-invalid={errors.customerName ? true : undefined}>
              <FieldLabel htmlFor="customer-name">
                Customer name
              </FieldLabel>
              <Input
                id="customer-name"
                className="h-10"
                placeholder="e.g. Priya Sharma"
                autoComplete="off"
                value={values.customerName}
                onChange={(event) =>
                  onChange({ customerName: event.target.value })
                }
                aria-invalid={errors.customerName ? true : undefined}
                disabled={isActive}
              />
              {errors.customerName && (
                <FieldError>{errors.customerName}</FieldError>
              )}
            </Field>

            <Field data-invalid={errors.phone ? true : undefined}>
              <FieldLabel htmlFor="customer-phone">
                Phone number
              </FieldLabel>
              <Input
                id="customer-phone"
                type="tel"
                inputMode="tel"
                className="h-10 font-mono"
                placeholder="+91 98765 43210"
                autoComplete="off"
                value={values.phone}
                onChange={(event) =>
                  onChange({ phone: event.target.value })
                }
                aria-invalid={errors.phone ? true : undefined}
                disabled={isActive}
              />
              {errors.phone && (
                <FieldError>{errors.phone}</FieldError>
              )}
            </Field>

            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="language">Language</FieldLabel>
              <Select
                items={LANGUAGE_ITEMS}
                value={values.language}
                onValueChange={(value) => {
                  if (value) {
                    onChange({ language: value as CallLanguage })
                  }
                }}
                disabled={isActive}
              >
                <SelectTrigger id="language" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {LANGUAGE_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          <div className="flex items-start gap-3 rounded-lg border p-3">
            <Checkbox
              id="recording-consent"
              checked={recordingConsent}
              onCheckedChange={(checked: boolean) =>
                onRecordingConsentChange(checked)
              }
              disabled={isActive}
            />
            <div className="flex flex-col gap-1">
              <label
                htmlFor="recording-consent"
                className="cursor-pointer text-sm font-medium"
              >
                I consent to recording this conversation
              </label>
              <p className="text-xs text-muted-foreground">
                The conversation audio, including the AI voice, will be
                saved for playback and review. You can decline recording.
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col items-center gap-4">
            <VoiceOrb
              status={status}
              micActive={micActive}
              level={micLevel}
              agentSpeaking={agentSpeaking}
            />

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 font-mono text-2xl font-semibold tabular-nums text-foreground">
                <Timer
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <span>{formatDuration(elapsed)}</span>
                <span className="sr-only">call duration</span>
              </div>

              <Badge
                variant="outline"
                className={cn(
                  "gap-1",
                  micActive
                    ? "border-success/30 bg-success/10 text-success"
                    : "text-muted-foreground",
                )}
              >
                {micActive ? (
                  <Mic aria-hidden="true" />
                ) : (
                  <MicOff aria-hidden="true" />
                )}
                {micActive ? "Mic active" : "Mic off"}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
            <Button
              type="submit"
              size="lg"
              className="h-12 text-sm font-semibold"
              disabled={isActive}
            >
              <Phone data-icon="inline-start" />
              {status === "ended" ? "Start New Call" : "Start Call"}
            </Button>

            <Button
              type="button"
              size="lg"
              variant="destructive"
              className="h-12 px-6"
              disabled={!isActive}
              onClick={onEnd}
            >
              <PhoneOff data-icon="inline-start" />
              End Call
            </Button>
          </div>

          {status === "ended" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="self-center text-muted-foreground"
              onClick={onReset}
            >
              <RotateCcw data-icon="inline-start" />
              Clear session
            </Button>
          )}
        </form>

        <MicHelp permission={micPermission} />
      </CardContent>
    </Card>
  )
}

function MicHelp({ permission }: { permission: MicPermission }) {
  if (permission === "denied") {
    return (
      <Alert variant="destructive">
        <ShieldAlert />
        <AlertTitle>Microphone access blocked</AlertTitle>
        <AlertDescription>
          Allow microphone access from your browser&apos;s address bar,
          then start a new live voice session.
        </AlertDescription>
      </Alert>
    )
  }

  if (
    permission === "unsupported" ||
    permission === "no-device" ||
    permission === "error"
  ) {
    const title =
      permission === "no-device"
        ? "No microphone found"
        : permission === "unsupported"
          ? "Microphone not supported"
          : "Microphone unavailable"

    return (
      <Alert>
        <MicOff />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>
          {permission === "unsupported"
            ? "This browser or context may not support microphone access. Use a supported browser over HTTPS or localhost."
            : "Connect or enable a microphone, check browser permissions, and try again."}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="bg-muted/30">
      <Info />
      <AlertTitle>
        {permission === "granted"
          ? "Microphone ready"
          : "Microphone permission"}
      </AlertTitle>
      <AlertDescription>
        Live AI mode streams microphone audio to Gemini through your
        configured backend. Recording will be saved only after you
        consent and complete a call. No real customer is dialed.
      </AlertDescription>
    </Alert>
  )
}


