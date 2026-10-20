import { AudioLines } from "lucide-react"

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-indigo shadow-[0_0_20px_-4px] shadow-primary/60">
        <AudioLines className="size-4 text-primary-foreground" aria-hidden="true" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-sm font-semibold tracking-tight text-foreground">
          VoicePilot <span className="text-primary-soft">AI</span>
        </span>
        <span className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Voice Sales</span>
      </div>
    </div>
  )
}
