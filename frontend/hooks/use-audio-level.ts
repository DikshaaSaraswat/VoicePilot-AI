"use client"

import { useEffect, useState } from "react"

/** Returns a smoothed 0–1 input level for a live MediaStream (local only). */
export function useAudioLevel(stream: MediaStream | null) {
  const [level, setLevel] = useState(0)

  useEffect(() => {
    if (!stream) {
      setLevel(0)
      return
    }
    const AudioContextCtor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextCtor) return

    const context = new AudioContextCtor()
    const source = context.createMediaStreamSource(stream)
    const analyser = context.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)
    const data = new Uint8Array(analyser.frequencyBinCount)

    let frame = 0
    let smoothed = 0
    let lastCommit = 0
    const tick = (time: number) => {
      analyser.getByteTimeDomainData(data)
      let sum = 0
      for (const value of data) {
        const centered = (value - 128) / 128
        sum += centered * centered
      }
      const rms = Math.min(1, Math.sqrt(sum / data.length) * 4)
      smoothed = smoothed * 0.75 + rms * 0.25
      if (time - lastCommit > 60) {
        setLevel(smoothed)
        lastCommit = time
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      source.disconnect()
      void context.close()
    }
  }, [stream])

  return level
}
