"use client"

import { Bell, LogOut, Menu, Search, Settings, User } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { LiveDot } from "@/components/shared/badges"
import type { NavSection } from "@/lib/types"

interface TopHeaderProps {
  title: string
  subtitle: string
  onOpenMobileNav: () => void
  onNavigate: (section: NavSection) => void
  onSearch: (query: string) => void
}

export function TopHeader({ title, subtitle, onOpenMobileNav, onNavigate, onSearch }: TopHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 md:px-8">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onOpenMobileNav}
          aria-label="Open navigation"
        >
          <Menu />
        </Button>

        <form
          role="search"
          className="hidden max-w-sm flex-1 md:block"
          onSubmit={(event) => {
            event.preventDefault()
            const query = String(new FormData(event.currentTarget).get("q") ?? "").trim()
            onSearch(query)
          }}
        >
          <InputGroup className="h-9 bg-card/60">
            <InputGroupAddon>
              <Search aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput name="q" placeholder="Search calls, customers..." aria-label="Search calls and customers" />
            <InputGroupAddon align="inline-end">
              <kbd className="rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
                Enter
              </kbd>
            </InputGroupAddon>
          </InputGroup>
        </form>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-success/25 bg-success/10 px-3 py-1.5 sm:flex">
            <LiveDot className="bg-success" />
            <span className="text-xs font-medium text-success">AI Agent Ready</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Notifications"
            onClick={() => toast.info("You're all caught up", { description: "No new notifications." })}
          >
            <Bell />
            <span aria-hidden="true" className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" className="h-9 gap-2 px-1.5" aria-label="Open profile menu">
                  <Avatar className="size-7">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-indigo text-[11px] font-semibold text-primary-foreground">
                      AK
                    </AvatarFallback>
                  </Avatar>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">Aarav Kapoor</span>
                  <span className="text-xs font-normal text-muted-foreground">Sales Manager</span>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => toast.info("Profile settings are not part of this demo.")}>
                  <User />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate("settings")}>
                  <Settings />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => toast.info("Authentication is not connected in this frontend demo.")}>
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-col gap-1 px-4 pt-5 pb-1 md:px-8">
        <h1 className="text-pretty text-xl font-semibold tracking-tight text-foreground md:text-2xl">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </header>
  )
}
