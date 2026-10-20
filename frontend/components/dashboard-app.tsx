
"use client"

import { useCallback, useEffect, useState } from "react"
import { FlaskConical } from "lucide-react"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { TopHeader } from "@/components/layout/top-header"
import { MetricCards } from "@/components/dashboard/metric-cards"
import { CallControls } from "@/components/call/call-controls"
import { LiveTranscript } from "@/components/call/live-transcript"
import { CallInsightsCard } from "@/components/call/call-insights"
import {
  RecentCallsTable,
  type StatusFilter,
} from "@/components/calls/recent-calls-table"
import { RecordingPlayer } from "@/components/calls/recording-player"
import { CallDetailsDialog } from "@/components/calls/call-details-dialog"
import { AnalyticsSection } from "@/components/sections/analytics-section"
import { SettingsSection } from "@/components/sections/settings-section"
import { useLiveVoiceSession } from "@/hooks/use-live-voice-session"
import { useMicrophone } from "@/hooks/use-microphone"
import { useAudioLevel } from "@/hooks/use-audio-level"
import { callsApi } from "@/lib/api/calls"
import {
  apiRequest,
  describeApiError,
} from "@/lib/api/client"
import { PRODUCTS } from "@/lib/demo/demo-data"
import type {
  CallFormErrors,
  CallFormValues,
  CallInsights,
  CallRecord,
  NavSection,
  TranscriptMessage,
  SalesStatus,
} from "@/lib/types"

const SECTION_COPY: Record<NavSection, { title: string; subtitle: string }> = {
  overview: {
    title: "Sales Command Center",
    subtitle: "Your AI sales assistant, ready to connect.",
  },
  "new-call": {
    title: "New Call",
    subtitle: "Configure the agent and start a conversation.",
  },
  history: {
    title: "Call History",
    subtitle: "Every conversation, outcome, and recording in one place.",
  },
  analytics: {
    title: "Analytics",
    subtitle: "Outcomes and conversation trends across your pipeline.",
  },
  settings: {
    title: "Settings",
    subtitle: "Backend connection and voice integrations.",
  },
}

const INITIAL_FORM: CallFormValues = {
  productId: PRODUCTS[0].id,
  customerName: "",
  phone: "",
  language: "auto",
}

interface BackendCall {
  id: string
  customerName: string
  phone: string
  productId: string
  language: string
  startedAt: string
  durationSeconds: number
  salesStatus: SalesStatus
  summary: string
  transcript: TranscriptMessage[]
  recordingUrl: string | null
  source: "live" | "simulated"
  analysis?: {
    requirements?: string[]
    objections?: string[]
    sentiment?: "Positive" | "Neutral" | "Negative"
    sentimentScore?: number
    nextSteps?: string[]
    followUpDate?: string
    summary?: string
    salesStatus?: SalesStatus
  }
}

function validate(values: CallFormValues): CallFormErrors {
  const errors: CallFormErrors = {}

  if (values.customerName.trim().length < 2) {
    errors.customerName = "Enter the customer's name."
  }

  const digits = values.phone.replace(/\D/g, "")
  if (digits.length < 10 || digits.length > 15) {
    errors.phone = "Enter a valid phone number (10–15 digits)."
  }

  return errors
}

function createLiveInsights(): CallInsights {
  return {
    requirements: [],
    objections: [],
    sentiment: "Neutral",
    sentimentScore: 0,
    nextSteps: ["Generating AI analysis..."],
    followUpDate: "",
    summary: "Analyzing the conversation with Gemini...",
    salesStatus: "Follow-up Required",
    source: "live",
  }
}

function toInsights(data: BackendCall): CallInsights {
  const analysis = data.analysis ?? {}

  return {
    requirements: analysis.requirements ?? [],
    objections: analysis.objections ?? [],
    sentiment: analysis.sentiment ?? "Neutral",
    sentimentScore: analysis.sentimentScore ?? 0,
    nextSteps: analysis.nextSteps ?? [],
    followUpDate: analysis.followUpDate ?? "",
    summary: analysis.summary ?? data.summary ?? "",
    salesStatus: analysis.salesStatus ?? data.salesStatus,
    source: "live",
  }
}

export function DashboardApp() {
  const [section, setSection] = useState<NavSection>("overview")
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [calls, setCalls] = useState<CallRecord[]>([])
  const [isLoadingCalls, setIsLoadingCalls] = useState(true)
  const [callsError, setCallsError] = useState<string | null>(null)
  const [lastCallId, setLastCallId] = useState<string | null>(null)
  const [form, setForm] = useState<CallFormValues>(INITIAL_FORM)
  const [errors, setErrors] = useState<CallFormErrors>({})
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [detailsCall, setDetailsCall] = useState<CallRecord | null>(null)
  const [recordingCall, setRecordingCall] = useState<CallRecord | null>(null)
  const [recordingConsent, setRecordingConsent] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [liveTranscript, setLiveTranscript] = useState<TranscriptMessage[]>([])
  const [liveInsights, setLiveInsights] = useState<CallInsights | null>(null)
  const [activeCall, setActiveCall] = useState<CallFormValues | null>(null)
  const [callStartedAt, setCallStartedAt] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadCalls() {
      setIsLoadingCalls(true)
      setCallsError(null)

      try {
        const data = await callsApi.listCalls()
        if (!cancelled) setCalls(data)
      } catch (error) {
        if (!cancelled) setCallsError(describeApiError(error))
      } finally {
        if (!cancelled) setIsLoadingCalls(false)
      }
    }

    void loadCalls()

    return () => {
      cancelled = true
    }
  }, [])

  const refreshCalls = async () => {
    try {
      const data = await callsApi.listCalls()
      setCalls(data)
      setCallsError(null)
    } catch (error) {
      setCallsError(describeApiError(error))
      toast.error("Could not refresh call history", {
        description: describeApiError(error),
      })
    }
  }

  const handleTranscript = useCallback((message: TranscriptMessage) => {
    setLiveTranscript((previous) => {
      const last = previous[previous.length - 1]

      if (last && last.speaker === message.speaker) {
        return [
          ...previous.slice(0, -1),
          {
            ...last,
            text: `${last.text} ${message.text}`.trim(),
            offsetSeconds: message.offsetSeconds,
          },
        ]
      }

      return [...previous, message]
    })
  }, [])

  const handleVoiceError = useCallback((message: string) => {
    toast.error("Live voice session error", {
      description: message,
    })
  }, [])

  const session = useLiveVoiceSession({
    onTranscript: handleTranscript,
    onError: handleVoiceError,
  })

  const mic = useMicrophone()
  const micLevel = useAudioLevel(mic.stream)

  const navigate = (next: NavSection) => {
    setSection(next)
    setMobileNavOpen(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const updateForm = (patch: Partial<CallFormValues>) => {
    setForm((previous) => ({ ...previous, ...patch }))

    setErrors((previous) => {
      const next = { ...previous }
      if ("customerName" in patch) delete next.customerName
      if ("phone" in patch) delete next.phone
      return next
    })
  }

  const handleStart = async () => {
    const nextErrors = validate(form)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      toast.error("Check the call details", {
        description: Object.values(nextErrors)[0],
      })
      return
    }

    setLiveTranscript([])
    setLiveInsights(null)
    setActiveCall({ ...form })
    setLastCallId(null)
    setCallStartedAt(new Date().toISOString())

    await session.start(form, recordingConsent)
  }

  const handleEnd = async () => {
    if (!activeCall) {
      await session.end()
      mic.stop()
      return
    }

    const transcript = [...liveTranscript]
    const startedAt = callStartedAt ?? new Date().toISOString()
    const durationSeconds = session.elapsed

    const recordingBlob = await session.end()
    mic.stop()

    if (transcript.length === 0) {
      toast.error("No transcript available", {
        description: "There is no conversation text to analyze.",
      })
      return
    }

    setIsAnalyzing(true)
    setLiveInsights(createLiveInsights())

    try {
      const saved = await callsApi.saveCallLog({
        customer_name: activeCall.customerName,
        phone_number: activeCall.phone,
        product_id: activeCall.productId,
        language: activeCall.language,
        started_at: startedAt,
        duration_seconds: durationSeconds,
        sales_status: "Follow-up Required",
        summary: "",
        transcript: transcript.map(({ speaker, text, offsetSeconds }) => ({
          speaker,
          text,
          offsetSeconds,
        })),
        is_simulated: false,
      })

      const callId = saved.id
      setLastCallId(callId)

      if (recordingBlob && recordingBlob.size > 0) {
        try {
          const formData = new FormData()
          formData.append("recording", recordingBlob, "voicepilot-call.webm")

          const response = await fetch(callsApi.recordingUrl(callId), {
            method: "POST",
            body: formData,
          })

          if (!response.ok) {
            throw new Error(`Upload failed (${response.status})`)
          }

          toast.success("Call recording saved", {
            description: "Your audio is ready for playback.",
          })
        } catch (error) {
          console.error("[VoicePilot] Recording upload failed:", error)
          toast.error("Recording upload failed", {
            description:
              "The transcript may still be saved, but audio playback may be unavailable.",
          })
        }
      } else if (recordingConsent) {
        toast.warning("No audio recording captured", {
          description:
            "The call was saved, but the browser did not produce an audio recording.",
        })
      }

      const analyzedCall = await apiRequest<BackendCall>(
        `/api/calls/${encodeURIComponent(callId)}/analyze`,
        {
          method: "POST",
          timeoutMs: 60_000,
        },
      )

      const insights = toInsights(analyzedCall)

      const record: CallRecord = {
        id: analyzedCall.id,
        customerName: analyzedCall.customerName,
        phone: analyzedCall.phone,
        productId: analyzedCall.productId,
        language: analyzedCall.language as CallRecord["language"],
        startedAt: analyzedCall.startedAt,
        durationSeconds: analyzedCall.durationSeconds,
        salesStatus: analyzedCall.salesStatus,
        summary: analyzedCall.summary,
        recordingUrl: analyzedCall.recordingUrl,
        source: analyzedCall.source,
        transcript: analyzedCall.transcript,
        insights,
      }

      setLiveInsights(insights)
      setCalls((previous) => [
        record,
        ...previous.filter((call) => call.id !== record.id),
      ])

      toast.success("Call analyzed successfully", {
        description: "Gemini generated the post-call insights.",
      })

      await refreshCalls()
    } catch (error) {
      toast.error("Could not analyze the call", {
        description: describeApiError(error),
      })

      setLiveInsights((previous) =>
        previous
          ? {
              ...previous,
              summary: "Analysis failed. Check the backend and retry.",
              nextSteps: [
                "Check the backend, then retry the AI analysis.",
              ],
            }
          : previous,
      )

      await refreshCalls()
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleReset = () => {
    session.reset()
    mic.stop()
    setLiveTranscript([])
    setLiveInsights(null)
    setActiveCall(null)
    setCallStartedAt(null)
    setLastCallId(null)
  }

  const handleInsightsChange = (patch: Partial<CallInsights>) => {
    setLiveInsights((previous) =>
      previous ? { ...previous, ...patch } : previous,
    )

    if (!lastCallId) return

    setCalls((previous) =>
      previous.map((call) =>
        call.id === lastCallId
          ? {
              ...call,
              ...(patch.salesStatus
                ? { salesStatus: patch.salesStatus }
                : {}),
              ...(patch.summary !== undefined
                ? { summary: patch.summary }
                : {}),
              insights: call.insights
                ? { ...call.insights, ...patch }
                : call.insights,
            }
          : call,
      ),
    )

    if (patch.salesStatus) {
      toast.success(`Status set to ${patch.salesStatus}`)
    }
  }

  const handleSave = async () => {
    const call = calls.find((item) => item.id === lastCallId)

    if (!call) {
      toast.info("Call already saved", {
        description: "This call was saved to the backend before analysis.",
      })
      return
    }

    setIsSaving(true)

    try {
      await callsApi.updateCall(call.id, {
        sales_status: liveInsights?.salesStatus ?? call.salesStatus,
        summary: liveInsights?.summary ?? call.summary,
      })

      await refreshCalls()
      toast.success("Call updates saved to backend")
    } catch (error) {
      toast.error("Could not save call updates", {
        description: describeApiError(error),
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePlay = (call: CallRecord) => {
    const playableCall = call.recordingUrl
      ? {
          ...call,
          recordingUrl: callsApi.recordingUrl(call.id),
        }
      : call

    setRecordingCall(playableCall)

    if (!call.recordingUrl) {
      toast.info("No recording available", {
        description:
          "This call has no saved audio recording. Check whether recording consent was enabled.",
      })
    }
  }

  const copy = SECTION_COPY[section]

  const workspace = (
    <section
      aria-labelledby="workspace-heading"
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2
          id="workspace-heading"
          className="text-sm font-medium text-foreground"
        >
          Voice Call Workspace
        </h2>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FlaskConical
            className="size-3.5 text-info"
            aria-hidden="true"
          />
          Live AI mode — microphone audio is sent to your configured backend.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <CallControls
          values={form}
          errors={errors}
          onChange={updateForm}
          status={session.status}
          elapsed={session.elapsed}
          micPermission={mic.permission}
          micActive={session.status === "in-call"}
          micLevel={micLevel}
          agentSpeaking={false}
          recordingConsent={recordingConsent}
          onRecordingConsentChange={setRecordingConsent}
          onStart={handleStart}
          onEnd={handleEnd}
          onReset={handleReset}
        />

        <LiveTranscript
          status={session.status}
          messages={liveTranscript}
          isAgentTyping={false}
          customerName={activeCall?.customerName}
        />
      </div>

      <CallInsightsCard
        status={session.status}
        insights={liveInsights}
        onChange={handleInsightsChange}
        onSave={handleSave}
        isSaving={isSaving || isAnalyzing}
      />
    </section>
  )

  const callsTable = (limit?: number) => (
    <RecentCallsTable
      calls={calls}
      query={query}
      onQueryChange={setQuery}
      statusFilter={statusFilter}
      onStatusFilterChange={setStatusFilter}
      onView={setDetailsCall}
      onPlay={handlePlay}
      limit={limit}
      title={limit ? "Recent Calls" : "All Calls"}
    />
  )

  return (
    <div className="min-h-dvh bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border lg:block">
        <AppSidebar
          active={section}
          onNavigate={navigate}
          isCallActive={
            session.status === "connecting" ||
            session.status === "in-call"
          }
        />
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="w-72 p-0"
          showCloseButton={false}
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Main application navigation
          </SheetDescription>
          <AppSidebar
            active={section}
            onNavigate={navigate}
            isCallActive={
              session.status === "connecting" ||
              session.status === "in-call"
            }
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-dvh flex-col lg:pl-64">
        <TopHeader
          title={copy.title}
          subtitle={copy.subtitle}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onNavigate={navigate}
          onSearch={(value) => {
            setQuery(value)
            navigate("history")
          }}
        />

        <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-8 px-4 py-6 md:px-8 md:py-8">
          {callsError && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
            >
              <p className="font-medium">
                Could not load call history from the backend.
              </p>
              <p className="mt-1 text-muted-foreground">{callsError}</p>
              <button
                type="button"
                onClick={() => void refreshCalls()}
                className="mt-3 underline underline-offset-4"
              >
                Retry
              </button>
            </div>
          )}

          {isLoadingCalls && (
            <p role="status" className="text-sm text-muted-foreground">
              Loading call history from backend...
            </p>
          )}

          {section === "overview" && (
            <>
              <MetricCards />
              {workspace}
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                {callsTable(5)}
                <RecordingPlayer call={recordingCall} />
              </div>
            </>
          )}

          {section === "new-call" && workspace}

          {section === "history" && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              {callsTable()}
              <div className="xl:sticky xl:top-24 xl:self-start">
                <RecordingPlayer call={recordingCall} />
              </div>
            </div>
          )}

          {section === "analytics" && <AnalyticsSection calls={calls} />}
          {section === "settings" && <SettingsSection />}
        </main>
      </div>

      <CallDetailsDialog
        call={detailsCall}
        onOpenChange={(open) => !open && setDetailsCall(null)}
      />
    </div>
  )
}
