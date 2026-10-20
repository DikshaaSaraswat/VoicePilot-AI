"use client"

import * as React from "react"

type CheckboxProps = {
  id?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export function Checkbox({
  id,
  checked = false,
  onCheckedChange,
  disabled = false,
  className = "",
}: CheckboxProps) {
  return (
    <button
      id={id}
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary ${
        checked ? "bg-primary text-primary-foreground" : "bg-background"
      } ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      } ${className}`}
    >
      {checked && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m5 12 4 4L19 6" />
        </svg>
      )}
    </button>
  )
}