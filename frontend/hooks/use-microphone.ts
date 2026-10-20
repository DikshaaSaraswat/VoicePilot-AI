"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { MicPermission } from "@/lib/types"

function mapPermissionState(state: PermissionState): MicPermission {
  if (state === "granted") return "granted"
  if (state === "denied") return "denied"
  return "prompt"
}

/**
 * Manages browser microphone access. Audio stays local — the stream is only
 * used for the on-screen level meter and is never recorded or uploaded.
 */
export function useMicrophone() {
  const [permission, setPermission] = useState<MicPermission>("unknown")
  const [stream, setStream] = useState<MediaStream | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setPermission("unsupported")
      return
    }
    if (!navigator.permissions?.query) {
      setPermission("prompt")
      return
    }

    let cancelled = false
    let status: PermissionStatus | null = null
    const handleChange = () => {
      if (status) setPermission(mapPermissionState(status.state))
    }

    navigator.permissions
      .query({ name: "microphone" as PermissionName })
      .then((result) => {
        if (cancelled) return
        status = result
        setPermission(mapPermissionState(result.state))
        result.addEventListener("change", handleChange)
      })
      .catch(() => {
        if (!cancelled) setPermission("prompt")
      })

    return () => {
      cancelled = true
      status?.removeEventListener("change", handleChange)
    }
  }, [])

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setStream(null)
  }, [])

  const request = useCallback(async (): Promise<MicPermission> => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setPermission("unsupported")
      return "unsupported"
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      })
      streamRef.current = media
      setStream(media)
      setPermission("granted")
      return "granted"
    } catch (error) {
      const name = error instanceof DOMException ? error.name : ""
      const next: MicPermission =
        name === "NotAllowedError" || name === "SecurityError"
          ? "denied"
          : name === "NotFoundError" || name === "OverconstrainedError"
            ? "no-device"
            : "error"
      setPermission(next)
      return next
    }
  }, [])

  useEffect(() => stop, [stop])

  return { permission, stream, isActive: stream !== null, request, stop }
}
