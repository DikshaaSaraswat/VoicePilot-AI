"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { buildSimulatedInsights, getSimulationScript } from "@/lib/demo/simulation"
import { getProductName } from "@/lib/demo/demo-data"
import type { CallFormValues, CallInsights, CallRecord, CallStatus, TranscriptMessage } from "@/lib/types"

const CONNECT_DELAY_MS = 1800
const TYPING_DELAY_MS = 1400
const CUSTOMER_DELAY_MS = 2600

interface UseCallSessionOptions {
  onCallEnded?: (record: CallRecord) => void
}

/**
 * Drives a simulated call session for UI demonstration.
 * The public shape (status / elapsed / transcript / insights / start / end)
 * is what a real voice-provider adapter should expose later.
 */
export function useCallSession({ onCallEnded }: UseCallSessionOptions = {}) {
  const [status, setStatus] = useState<CallStatus>("ready")
  const [elapsed, setElapsed] = useState(0)
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([])
  const [isAgentTyping, setIsAgentTyping] = useState(false)
  const [insights, setInsights] = useState<CallInsights | null>(null)
  const [activeCall, setActiveCall] = useState<CallFormValues | null>(null)

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const connectedAtRef = useRef<number | null>(null)
  const startedAtRef = useRef<string | null>(null)
  const transcriptRef = useRef<TranscriptMessage[]>([])
  const onCallEndedRef = useRef(onCallEnded)
  onCallEndedRef.current = onCallEnded

  const clearTimers = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = null
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  const schedule = (fn: () => void, delay: number) => {
    timeoutsRef.current.push(setTimeout(fn, delay))
  }

  const secondsSinceConnect = () =>
    connectedAtRef.current ? Math.floor((Date.now() - connectedAtRef.current) / 1000) : 0

  const pushMessage = (message: Omit<TranscriptMessage, "id" | "offsetSeconds" | "source">) => {
    const next: TranscriptMessage = {
      ...message,
      id: `sim-${Date.now()}-${transcriptRef.current.length}`,
      offsetSeconds: secondsSinceConnect(),
      source: "simulated",
    }
    transcriptRef.current = [...transcriptRef.current, next]
    setTranscript(transcriptRef.current)
  }

  const start = useCallback(
    (values: CallFormValues) => {
      clearTimers()
      transcriptRef.current = []
      connectedAtRef.current = null
      startedAtRef.current = new Date().toISOString()
      setTranscript([])
      setInsights(null)
      setElapsed(0)
      setIsAgentTyping(false)
      setActiveCall(values)
      setStatus("connecting")

      const script = getSimulationScript(values.language, {
        name: values.customerName.split(" ")[0] || values.customerName,
        product: getProductName(values.productId),
      })

      schedule(() => {
        connectedAtRef.current = Date.now()
        setStatus("in-call")
        intervalRef.current = setInterval(() => setElapsed(secondsSinceConnect()), 1000)

        let cursor = 600
        script.forEach((line) => {
          if (line.speaker === "agent") {
            schedule(() => setIsAgentTyping(true), cursor)
            cursor += TYPING_DELAY_MS
            schedule(() => {
              setIsAgentTyping(false)
              pushMessage(line)
            }, cursor)
          } else {
            cursor += CUSTOMER_DELAY_MS
            schedule(() => pushMessage(line), cursor)
          }
          cursor += 900
        })
      }, CONNECT_DELAY_MS)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clearTimers],
  )

  const end = useCallback(() => {
    if (!activeCall) return
    clearTimers()
    setIsAgentTyping(false)
    const duration = secondsSinceConnect()
    setElapsed(duration)
    setStatus("ended")

    const productName = getProductName(activeCall.productId)
    const generated = buildSimulatedInsights({
      transcript: transcriptRef.current,
      customerName: activeCall.customerName,
      productName,
    })
    setInsights(generated)

    onCallEndedRef.current?.({
      id: `sim-${Date.now()}`,
      customerName: activeCall.customerName,
      phone: activeCall.phone,
      productId: activeCall.productId,
      language: activeCall.language,
      startedAt: startedAtRef.current ?? new Date().toISOString(),
      durationSeconds: duration,
      salesStatus: generated.salesStatus,
      summary: generated.summary,
      recordingUrl: null,
      source: "simulated",
      transcript: transcriptRef.current,
      insights: generated,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCall, clearTimers])

  const reset = useCallback(() => {
    clearTimers()
    transcriptRef.current = []
    setTranscript([])
    setInsights(null)
    setElapsed(0)
    setIsAgentTyping(false)
    setActiveCall(null)
    setStatus("ready")
  }, [clearTimers])

  return {
    status,
    elapsed,
    transcript,
    isAgentTyping,
    insights,
    setInsights,
    activeCall,
    isActive: status === "connecting" || status === "in-call",
    start,
    end,
    reset,
  }
}
