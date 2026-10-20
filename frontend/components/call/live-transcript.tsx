"use client"

import { useEffect, useRef } from "react"
import { Bot, MessageSquareText, Sparkles, UserRound } from "lucide-react"
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { LiveDot, SourceBadge } from "@/components/shared/badges"
import { formatDuration } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { CallStatus, TranscriptMessage } from "@/lib/types"

interface LiveTranscriptProps {
  status: CallStatus
  messages: TranscriptMessage[]
  isAgentTyping: boolean
  customerName?: string
}

export function LiveTranscript({ status, messages, isAgentTyping, customerName }: LiveTranscriptProps) {
  const endRef = useRef<HTMLDivElement>(null)
  const isLive = status === "in-call"

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages.length, isAgentTyping])

  return (
    <Card className="flex min-h-[560px] flex-col gap-0 py-0 lg:h-full">
      <CardHeader className="border-b border-border py-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquareText className="size-4 text-primary-soft" aria-hidden="true" />
          Live Transcript
        </CardTitle>
        <CardDescription className="truncate">
          {customerName ? `Conversation with ${customerName}` : "Real-time speech-to-text feed"}
        </CardDescription>
        <CardAction className="flex items-center gap-2">
          {messages.length > 0 && <SourceBadge source={messages[0].source} />}
          {isLive ? (
            <span className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-destructive">
              <LiveDot className="bg-destructive" />
              Live
            </span>
          ) : null}
        </CardAction>
      </CardHeader>

      <div
        className="scrollbar-thin flex-1 overflow-y-auto px-4 py-5 md:px-6 lg:max-h-[640px]"
        role="log"
        aria-live="polite"
        aria-label="Call transcript"
      >
        {status === "connecting" ? (
          <div className="flex h-full min-h-80 flex-col items-center justify-center gap-3 text-center">
            <Spinner className="size-5 text-warning" />
            <p className="text-sm text-muted-foreground">Connecting simulated session...</p>
          </div>
        ) : messages.length === 0 && !isAgentTyping ? (
          <Empty className="h-full min-h-80 border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessageSquareText />
              </EmptyMedia>
              <EmptyTitle>Your conversation will appear here</EmptyTitle>
              <EmptyDescription>
                Start a call to see the AI agent and customer transcript stream in real time, with timestamps for every
                turn.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ol className="flex flex-col gap-5">
            {messages[0]?.source === "simulated" && (
              <li className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                <span className="flex items-center gap-1.5">
                  <Sparkles className="size-3 text-info" aria-hidden="true" />
                  Scripted simulation — not a real customer conversation
                </span>
                <span className="h-px flex-1 bg-border" />
              </li>
            )}
            {messages.map((message) => (
              <TranscriptRow key={message.id} message={message} customerName={customerName} />
            ))}
            {isAgentTyping && (
              <li className="flex items-start gap-3">
                <SpeakerAvatar speaker="agent" />
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-primary/20 bg-primary/10 px-4 py-3">
                  <span className="sr-only">AI agent is responding</span>
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      aria-hidden="true"
                      className="size-1.5 animate-bounce rounded-full bg-primary-soft"
                      style={{ animationDelay: `${dot * 0.15}s` }}
                    />
                  ))}
                </div>
              </li>
            )}
            {status === "ended" && (
              <li className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                Call ended
                <span className="h-px flex-1 bg-border" />
              </li>
            )}
          </ol>
        )}
        <div ref={endRef} />
      </div>
    </Card>
  )
}

function SpeakerAvatar({ speaker }: { speaker: TranscriptMessage["speaker"] }) {
  const isAgent = speaker === "agent"
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full border",
        isAgent ? "border-primary/30 bg-primary/15 text-primary-soft" : "border-border bg-muted text-muted-foreground",
      )}
    >
      {isAgent ? <Bot className="size-4" /> : <UserRound className="size-4" />}
    </span>
  )
}

function TranscriptRow({ message, customerName }: { message: TranscriptMessage; customerName?: string }) {
  const isAgent = message.speaker === "agent"
  return (
    <li className={cn("flex items-start gap-3", !isAgent && "flex-row-reverse")}>
      <SpeakerAvatar speaker={message.speaker} />
      <div className={cn("flex max-w-[82%] flex-col gap-1.5", !isAgent && "items-end")}>
        <div className="flex items-center gap-2 text-xs">
          <span className={cn("font-medium", isAgent ? "text-primary-soft" : "text-foreground")}>
            {isAgent ? "AI Agent" : `Customer${customerName ? ` · ${customerName.split(" ")[0]}` : ""}`}
          </span>
          <time className="font-mono text-muted-foreground tabular-nums">{formatDuration(message.offsetSeconds)}</time>
        </div>
        <p
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed text-pretty",
            isAgent
              ? "rounded-tl-sm border border-primary/20 bg-primary/10 text-foreground"
              : "rounded-tr-sm border border-border bg-secondary text-secondary-foreground",
          )}
        >
          {message.text}
        </p>
      </div>
    </li>
  )
}
