"use client"

import { BarChart3, History, LayoutDashboard, PhoneCall, Settings, type LucideIcon } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Logo } from "@/components/shared/logo"
import { cn } from "@/lib/utils"
import type { NavSection } from "@/lib/types"

export const NAV_ITEMS: { id: NavSection; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "new-call", label: "New Call", icon: PhoneCall },
  { id: "history", label: "Call History", icon: History },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
]

interface AppSidebarProps {
  active: NavSection
  onNavigate: (section: NavSection) => void
  isCallActive: boolean
}

export function AppSidebar({ active, onNavigate, isCallActive }: AppSidebarProps) {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-16 items-center px-5">
        <Logo />
      </div>
      <Separator className="bg-sidebar-border" />

      <nav aria-label="Main" className="flex-1 px-3 py-4">
        <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Workspace
        </p>
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = item.id === active
            const Icon = item.icon
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  )}
                >
                  {isActive && (
                    <span aria-hidden="true" className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary" />
                  )}
                  <Icon
                    aria-hidden="true"
                    className={cn("size-4", isActive ? "text-primary-soft" : "text-muted-foreground group-hover:text-foreground")}
                  />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.id === "new-call" && isCallActive && (
                    <span className="flex items-center gap-1 rounded-full bg-info/10 px-1.5 py-0.5 text-[10px] font-medium text-info">
                      <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-info" />
                      Live
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-3">
        <div className="flex items-center gap-3 rounded-xl border border-sidebar-border bg-card/60 p-3">
          <div className="relative">
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary-soft">SW</AvatarFallback>
            </Avatar>
            <span
              aria-hidden="true"
              className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-sidebar bg-success"
            />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">Sales Workspace</span>
            <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              AI Voice Agent
              <span className="sr-only">— online</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
