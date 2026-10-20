"use client"

import { useCallback, useRef, useState } from "react"
import { getVoiceWebSocketUrl } from "@/lib/api/client"
import type {
  CallFormValues,
  CallStatus,
  Speaker,
  TranscriptMessage,
} from "@/lib/types"

type LiveVoiceOptions = {
  onTranscript: (message: TranscriptMessage) => void
  onError: (message: string) => void
}

type ServerMessage = {
  type: string
  speaker?: Speaker
  text?: string
  data?: string
  mimeType?: string
  message?: string
}

const INPUT_SAMPLE_RATE = 16000
const OUTPUT_SAMPLE_RATE = 24000
const PROCESSOR_SIZE = 4096
const CONNECTION_TIMEOUT_MS = 15000

function floatToPcm16(samples: Float32Array): Int16Array {
  const pcm = new Int16Array(samples.length)

  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]))
    pcm[i] = sample < 0 ? sample * 32768 : sample * 32767
  }

  return pcm
}

function resample(
  input: Float32Array,
  sourceRate: number,
  targetRate: number,
): Float32Array {
  if (sourceRate === targetRate) return input

  const outputLength = Math.floor(
    (input.length * targetRate) / sourceRate,
  )
  const output = new Float32Array(outputLength)
  const ratio = sourceRate / targetRate

  for (let i = 0; i < outputLength; i++) {
    const position = i * ratio
    const left = Math.floor(position)
    const right = Math.min(left + 1, input.length - 1)
    const fraction = position - left

    output[i] =
      input[left] * (1 - fraction) + input[right] * fraction
  }

  return output
}

function toBase64(buffer: Int16Array): string {
  const bytes = new Uint8Array(
    buffer.buffer,
    buffer.byteOffset,
    buffer.byteLength,
  )

  let binary = ""
  const chunkSize = 0x8000

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(i, i + chunkSize),
    )
  }

  return btoa(binary)
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }

  return bytes
}

export function useLiveVoiceSession({
  onTranscript,
  onError,
}: LiveVoiceOptions) {
  const [status, setStatus] = useState<CallStatus>("ready")
  const [elapsed, setElapsed] = useState(0)

  const socketRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const silentGainRef = useRef<GainNode | null>(null)
  const recordingDestinationRef =
    useRef<MediaStreamAudioDestinationNode | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingChunksRef = useRef<Blob[]>([])
  const recordingConsentRef = useRef(false)
  const recordingResultRef = useRef<Promise<Blob | null> | null>(null)
  const resolveRecordingRef =
    useRef<((blob: Blob | null) => void) | null>(null)
  const recordingResolvedRef = useRef(false)

  const timerRef = useRef<number | null>(null)
  const connectionTimeoutRef = useRef<number | null>(null)
  const startedAtRef = useRef<number | null>(null)
  const playbackAtRef = useRef(0)
  const connectedRef = useRef(false)
  const messageIdRef = useRef(0)
  const endingRef = useRef(false)

  const resolveRecording = useCallback((blob: Blob | null) => {
    if (recordingResolvedRef.current) return

    recordingResolvedRef.current = true
    resolveRecordingRef.current?.(blob)
    resolveRecordingRef.current = null
  }, [])

  const startRecording = useCallback(
    (
      context: AudioContext,
      microphoneSource: MediaStreamAudioSourceNode,
    ) => {
      if (!recordingConsentRef.current) return

      if (
        typeof MediaRecorder === "undefined" ||
        typeof context.createMediaStreamDestination !== "function"
      ) {
        onError(
          "Audio recording is not supported by this browser. The live call can continue without a recording.",
        )
        return
      }

      try {
        const destination = context.createMediaStreamDestination()
        recordingDestinationRef.current = destination

        // Capture the microphone without playing it back through speakers.
        microphoneSource.connect(destination)

        const mimeType = MediaRecorder.isTypeSupported(
          "audio/webm;codecs=opus",
        )
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : ""

        const recorder = mimeType
          ? new MediaRecorder(destination.stream, { mimeType })
          : new MediaRecorder(destination.stream)

        mediaRecorderRef.current = recorder
        recordingChunksRef.current = []
        recordingResolvedRef.current = false

        recordingResultRef.current = new Promise<Blob | null>(
          (resolve) => {
            resolveRecordingRef.current = resolve
          },
        )

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordingChunksRef.current.push(event.data)
          }
        }

        recorder.onstop = () => {
          const chunks = recordingChunksRef.current
          const blob =
            chunks.length > 0
              ? new Blob(chunks, {
                  type: recorder.mimeType || "audio/webm",
                })
              : null

          recordingChunksRef.current = []
          mediaRecorderRef.current = null
          destination.stream.getTracks().forEach((track) => track.stop())
          recordingDestinationRef.current = null

          resolveRecording(blob)
        }

        recorder.onerror = () => {
          recordingChunksRef.current = []
          resolveRecording(null)
          onError("Audio recording failed. The call transcript may still be saved.")
        }

        recorder.start(1000)
        console.info("[VoicePilot] Audio recording started with consent.")
      } catch (error) {
        console.error("[VoicePilot] Could not start recording:", error)
        recordingDestinationRef.current = null
        mediaRecorderRef.current = null
        resolveRecording(null)
        onError(
          "Could not start audio recording. The live call can continue.",
        )
      }
    },
    [onError, resolveRecording],
  )

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    const recorder = mediaRecorderRef.current

    if (!recorder) {
      return recordingResultRef.current
        ? recordingResultRef.current
        : null
    }

    const result = recordingResultRef.current

    try {
      if (recorder.state !== "inactive") {
        recorder.stop()
      } else {
        resolveRecording(null)
      }
    } catch (error) {
      console.error("[VoicePilot] Could not stop recorder:", error)
      resolveRecording(null)
    }

    return result ? result : null
  }, [resolveRecording])

  const cleanup = useCallback(() => {
    connectedRef.current = false

    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (connectionTimeoutRef.current !== null) {
      window.clearTimeout(connectionTimeoutRef.current)
      connectionTimeoutRef.current = null
    }

    if (processorRef.current) {
      processorRef.current.onaudioprocess = null
      try {
        processorRef.current.disconnect()
      } catch {}
      processorRef.current = null
    }

    try {
      sourceRef.current?.disconnect()
    } catch {}
    sourceRef.current = null

    try {
      silentGainRef.current?.disconnect()
    } catch {}
    silentGainRef.current = null

    try {
      recordingDestinationRef.current?.disconnect()
    } catch {}
    recordingDestinationRef.current = null

    const socket = socketRef.current
    socketRef.current = null

    if (socket) {
      socket.onopen = null
      socket.onmessage = null
      socket.onerror = null
      socket.onclose = null

      if (
        socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING
      ) {
        if (socket.readyState === WebSocket.OPEN) {
          try {
            socket.send(JSON.stringify({ type: "end" }))
          } catch {}
        }

        try {
          socket.close(1000, "Call ended by client")
        } catch {}
      }
    }

    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null

    const context = audioContextRef.current
    audioContextRef.current = null

    if (context && context.state !== "closed") {
      void context.close().catch(() => {})
    }
  }, [])

  const end = useCallback(async (): Promise<Blob | null> => {
    if (endingRef.current) {
      return recordingResultRef.current
        ? recordingResultRef.current
        : null
    }

    endingRef.current = true

    if (startedAtRef.current !== null) {
      setElapsed(
        Math.floor((Date.now() - startedAtRef.current) / 1000),
      )
    }

    // Stop and finalize the recording before closing the audio context.
    const recording = await stopRecording()

    cleanup()
    setStatus("ended")

    return recording
  }, [cleanup, stopRecording])

  const start = useCallback(
    async (_values: CallFormValues, recordingConsent = false) => {
      if (
        connectedRef.current ||
        status === "connecting" ||
        status === "in-call"
      ) {
        return
      }

      cleanup()
      endingRef.current = false
      recordingConsentRef.current = recordingConsent
      recordingChunksRef.current = []
      recordingResultRef.current = null
      resolveRecordingRef.current = null
      recordingResolvedRef.current = false

      setElapsed(0)
      setStatus("connecting")
      playbackAtRef.current = 0
      startedAtRef.current = null

      try {
        if (
          !navigator.mediaDevices ||
          !navigator.mediaDevices.getUserMedia
        ) {
          throw new Error(
            "Microphone access is unavailable in this browser.",
          )
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        })

        if (endingRef.current) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream

        const context = new AudioContext()
        audioContextRef.current = context
        await context.resume()

        if (endingRef.current) return

        const socket = new WebSocket(getVoiceWebSocketUrl())
        socketRef.current = socket

        connectionTimeoutRef.current = window.setTimeout(() => {
          if (!connectedRef.current && !endingRef.current) {
            console.error("[VoicePilot] Connection timed out.")
            onError(
              "Voice connection timed out. Check that the backend is running.",
            )
            void end()
          }
        }, CONNECTION_TIMEOUT_MS)

        socket.onmessage = (event: MessageEvent<string>) => {
          let message: ServerMessage

          try {
            message = JSON.parse(event.data) as ServerMessage
          } catch (error) {
            console.error(
              "[VoicePilot] Invalid server message:",
              error,
            )
            return
          }

          if (message.type === "ready") {
            if (endingRef.current) return

            if (connectionTimeoutRef.current !== null) {
              window.clearTimeout(connectionTimeoutRef.current)
              connectionTimeoutRef.current = null
            }

            connectedRef.current = true
            startedAtRef.current = Date.now()
            setStatus("in-call")

            timerRef.current = window.setInterval(() => {
              if (startedAtRef.current !== null) {
                setElapsed(
                  Math.floor(
                    (Date.now() - startedAtRef.current) / 1000,
                  ),
                )
              }
            }, 250)

            const source = context.createMediaStreamSource(stream)
            sourceRef.current = source

            const processor = context.createScriptProcessor(
              PROCESSOR_SIZE,
              1,
              1,
            )
            processorRef.current = processor

            const silentGain = context.createGain()
            silentGain.gain.value = 0
            silentGainRef.current = silentGain

            processor.onaudioprocess = (audioEvent) => {
              if (
                !connectedRef.current ||
                socket.readyState !== WebSocket.OPEN
              ) {
                return
              }

              const input = audioEvent.inputBuffer.getChannelData(0)
              const converted = resample(
                input,
                context.sampleRate,
                INPUT_SAMPLE_RATE,
              )
              const pcm = floatToPcm16(converted)

              try {
                socket.send(
                  JSON.stringify({
                    type: "audio",
                    data: toBase64(pcm),
                  }),
                )
              } catch (error) {
                console.error(
                  "[VoicePilot] Audio send failed:",
                  error,
                )
              }
            }

            source.connect(processor)
            processor.connect(silentGain)
            silentGain.connect(context.destination)

            startRecording(context, source)

            console.info("[VoicePilot] Live voice session ready.")
            return
          }

          if (message.type === "transcript" && message.text) {
            const speaker: Speaker =
              message.speaker === "customer" ? "customer" : "agent"

            onTranscript({
              id: `live-${++messageIdRef.current}`,
              speaker,
              text: message.text,
              offsetSeconds: startedAtRef.current
                ? Math.floor(
                    (Date.now() - startedAtRef.current) / 1000,
                  )
                : 0,
              source: "live",
            })
            return
          }

          if (message.type === "audio" && message.data) {
            try {
              const bytes = fromBase64(message.data)
              const usableLength =
                bytes.byteLength - (bytes.byteLength % 2)

              if (usableLength === 0) return

              const pcm = new Int16Array(
                bytes.buffer,
                bytes.byteOffset,
                usableLength / 2,
              )

              const audioBuffer = context.createBuffer(
                1,
                pcm.length,
                OUTPUT_SAMPLE_RATE,
              )
              const channel = audioBuffer.getChannelData(0)

              for (let i = 0; i < pcm.length; i++) {
                channel[i] = pcm[i] / 32768
              }

              const player = context.createBufferSource()
              player.buffer = audioBuffer
              player.connect(context.destination)

              // Mix the AI voice into the recording as well.
              if (recordingDestinationRef.current) {
                player.connect(recordingDestinationRef.current)
              }

              const startAt = Math.max(
                context.currentTime,
                playbackAtRef.current,
              )

              player.start(startAt)
              playbackAtRef.current =
                startAt + audioBuffer.duration
            } catch (error) {
              console.error(
                "[VoicePilot] Audio playback failed:",
                error,
              )
            }
            return
          }

          if (message.type === "error") {
            console.error(
              "[VoicePilot] Backend voice error:",
              message.message,
            )
            onError(message.message || "Voice session failed.")
            void end()
          }
        }

        socket.onerror = (event) => {
          console.error("[VoicePilot] WebSocket error:", event)

          if (!endingRef.current) {
            onError(
              "Could not connect to the voice WebSocket. Check the backend terminal.",
            )
          }
        }

        socket.onclose = (event) => {
          console.warn("[VoicePilot] WebSocket closed:", {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
            connected: connectedRef.current,
          })

          if (endingRef.current) return

          if (event.code !== 1000) {
            onError(
              `Voice connection closed (code ${event.code}). ${
                event.reason || "No close reason provided."
              }`,
            )
          }

          void end()
        }
      } catch (error) {
        console.error("[VoicePilot] Failed to start:", error)

        cleanup()
        endingRef.current = false
        setStatus("ready")

        onError(
          error instanceof Error
            ? error.message
            : "Unable to start the voice session.",
        )
      }
    },
    [cleanup, end, onError, onTranscript, startRecording, status],
  )

  const reset = useCallback(() => {
    endingRef.current = true

    // Reset is intended for an inactive or already-ended session.
    if (mediaRecorderRef.current?.state === "recording") {
      try {
        mediaRecorderRef.current.stop()
      } catch {}
    }

    cleanup()
    setElapsed(0)
    startedAtRef.current = null
    recordingConsentRef.current = false
    recordingResultRef.current = null
    recordingChunksRef.current = []
    setStatus("ready")
  }, [cleanup])

  return {
    status,
    elapsed,
    start,
    end,
    reset,
  }
}
