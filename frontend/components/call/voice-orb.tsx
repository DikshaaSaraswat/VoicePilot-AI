import { Mic, MicOff, PhoneOff } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import type { CallStatus } from "@/lib/types"

const BAR_COUNT = 24
const BAR_SEEDS = Array.from({ length: BAR_COUNT }, (_, i) => 0.35 + Math.abs(Math.sin(i * 1.7)) * 0.65)

interface VoiceOrbProps {
  status: CallStatus
  micActive: boolean
  level: number
  agentSpeaking: boolean
}

export function VoiceOrb({ status, micActive, level, agentSpeaking }: VoiceOrbProps) {
  const isLive = status === "in-call"
  const isConnecting = status === "connecting"
  const scale = 1 + (micActive ? level * 0.18 : 0)

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative flex size-44 items-center justify-center md:size-52">
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 rounded-full border transition-colors duration-500",
            isLive ? "border-primary/40" : "border-border",
          )}
        />
        {isLive && (
          <>
            <div aria-hidden="true" className="animate-vp-ring absolute inset-4 rounded-full border border-primary/50" />
            <div
              aria-hidden="true"
              className="animate-vp-ring absolute inset-4 rounded-full border border-indigo/40 [animation-delay:1.2s]"
            />
          </>
        )}
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-6 rounded-full transition-all duration-500",
            isLive
              ? "bg-[radial-gradient(circle_at_50%_40%,rgba(124,92,255,0.35),rgba(99,102,241,0.12)_55%,transparent_75%)]"
              : "bg-[radial-gradient(circle_at_50%_40%,rgba(124,92,255,0.12),transparent_70%)]",
          )}
        />

        <div
          className={cn(
            "relative flex size-28 items-center justify-center rounded-full border transition-all duration-300 md:size-32",
            isLive
              ? "border-primary/50 bg-gradient-to-br from-primary to-indigo shadow-[0_0_60px_-10px] shadow-primary"
              : isConnecting
                ? "border-warning/40 bg-card"
                : "border-border bg-card",
          )}
          style={{ transform: `scale(${scale})` }}
        >
          {isConnecting ? (
            <Spinner className="size-7 text-warning" />
          ) : status === "ended" ? (
            <PhoneOff className="size-8 text-muted-foreground" aria-hidden="true" />
          ) : isLive && !micActive ? (
            <MicOff className="size-8 text-primary-foreground" aria-hidden="true" />
          ) : (
            <Mic className={cn("size-8", isLive ? "text-primary-foreground" : "text-primary-soft")} aria-hidden="true" />
          )}
        </div>
      </div>

      <div aria-hidden="true" className="flex h-10 items-center gap-[3px]">
        {BAR_SEEDS.map((seed, index) => {
          const animated = isLive && (agentSpeaking || micActive)
          const micHeight = micActive ? Math.max(0.15, Math.min(1, level * 1.6 * seed)) : 0.15
          return (
            <span
              key={index}
              className={cn(
                "w-[3px] rounded-full transition-[height,background-color] duration-150",
                isLive ? (index % 5 === 0 ? "bg-info" : "bg-primary-soft") : "bg-border",
                animated && agentSpeaking && "animate-vp-wave",
              )}
              style={{
                height: `${Math.round((agentSpeaking && isLive ? seed : isLive ? micHeight : 0.15 + seed * 0.1) * 40)}px`,
                animationDelay: `${(index % 8) * 0.09}s`,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
