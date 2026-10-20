"use client"

import { useRef, useState } from "react"
import { AudioLines, FileAudio, Pause, Play } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Slider } from "@/components/ui/slider"
import { Spinner } from "@/components/ui/spinner"
import { formatDuration } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { CallRecord } from "@/lib/types"

type PlayerState = "idle" | "loading" | "ready" | "error"

export function RecordingPlayer({ call }: { call: CallRecord | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileAudio className="size-4 text-primary-soft" aria-hidden="true" />
          Call Recording
        </CardTitle>
        <CardDescription className="truncate">
          {call ? `${call.customerName} · ${formatDuration(call.durationSeconds)}` : "Select a call to play its recording"}
        </CardDescription>
        {call && (
          <CardAction>
            <Badge
              variant="outline"
              className={cn(
                call.recordingUrl ? "border-success/30 bg-success/10 text-success" : "text-muted-foreground",
              )}
            >
              {call.recordingUrl ? "Available" : "Not available"}
            </Badge>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {call?.recordingUrl ? (
          <AudioControls key={call.recordingUrl} src={call.recordingUrl} fallbackDuration={call.durationSeconds} />
        ) : (
          <Empty className="border border-dashed border-border bg-muted/20 py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <AudioLines />
              </EmptyMedia>
              <EmptyTitle>No recording available</EmptyTitle>
              <EmptyDescription>
                {call
                  ? call.source === "live"
                    ? "The backend did not return a recording for this call."
                    : "Demo and simulated calls don't have audio. Recordings appear here once your voice backend stores them."
                  : "Choose “Play Recording” on any call in the table."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  )
}

function AudioControls({ src, fallbackDuration }: { src: string; fallbackDuration: number }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [state, setState] = useState<PlayerState>("loading")
  const [isPlaying, setIsPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(fallbackDuration)

  const toggle = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      try {
        await audio.play()
      } catch {
        setState("error")
      }
    } else {
      audio.pause()
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(event) => {
          const value = event.currentTarget.duration
          if (Number.isFinite(value)) setDuration(value)
          setState("ready")
        }}
        onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => setState("error")}
      />
      {state === "error" ? (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Recording could not be loaded. Check that the backend is running and the file exists.
        </p>
      ) : (
        <div className="flex items-center gap-3">
          <Button
            size="icon-lg"
            className="rounded-full"
            onClick={toggle}
            disabled={state !== "ready"}
            aria-label={isPlaying ? "Pause recording" : "Play recording"}
          >
            {state === "loading" ? <Spinner /> : isPlaying ? <Pause /> : <Play />}
          </Button>
          <div className="flex flex-1 flex-col gap-2">
            <Slider
              aria-label="Seek recording"
              min={0}
              max={Math.max(1, duration)}
              step={1}
              value={[current]}
              disabled={state !== "ready"}
              onValueChange={(value) => {
                const next = Array.isArray(value) ? value[0] : value
                if (audioRef.current) audioRef.current.currentTime = next
                setCurrent(next)
              }}
            />
            <div className="flex justify-between font-mono text-xs text-muted-foreground tabular-nums">
              <span>{formatDuration(current)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
