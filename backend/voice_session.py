
import asyncio
import base64
import contextlib
import traceback

from fastapi import WebSocket, WebSocketDisconnect
from google.genai import types

from gemini_live import create_gemini_client, GEMINI_LIVE_MODEL


SALES_INSTRUCTIONS = """
You are VoicePilot AI, a friendly and professional voice sales assistant
for TaskFlow AI, a fictional task and project management SaaS product.

Speak naturally and conversationally. Keep replies concise and easy to say aloud.
Introduce yourself, understand the customer's workflow and pain points,
explain relevant benefits, and ask thoughtful discovery questions.
Never pressure the customer or invent product features, prices, or guarantees.
Never claim a sale happened unless the customer clearly confirms it.
End with an appropriate next step, such as a demo or follow-up.
"""


async def handle_voice_websocket(websocket: WebSocket):
    await websocket.accept()

    client_connected = True
    sender_task = None
    receiver_task = None

    async def send_browser(payload: dict):
        nonlocal client_connected

        if not client_connected:
            return

        try:
            await websocket.send_json(payload)
        except Exception as exc:
            client_connected = False
            print(f"BROWSER SEND FAILED: {exc!r}", flush=True)

    async def receive_browser_messages(session):
        while True:
            message = await websocket.receive_json()
            message_type = message.get("type")

            if message_type == "audio":
                encoded = message.get("data", "")
                if not encoded:
                    continue

                try:
                    audio_bytes = base64.b64decode(encoded, validate=True)
                except Exception as exc:
                    print(f"INVALID AUDIO DATA: {exc!r}", flush=True)
                    continue

                await session.send_realtime_input(
                    audio=types.Blob(
                        data=audio_bytes,
                        mime_type="audio/pcm;rate=16000",
                    )
                )

            elif message_type == "text":
                text = message.get("text", "").strip()
                if text:
                    await session.send_realtime_input(text=text)

            elif message_type == "end":
                print("BROWSER REQUESTED CALL END", flush=True)
                return

    async def receive_gemini_responses(session):
        response_count = 0
        audio_count = 0
        transcript_count = 0

        try:
            while True:
                turn_responses = 0

                async for response in session.receive():
                    turn_responses += 1
                    response_count += 1

                    content = response.server_content
                    if content is None:
                        continue

                    input_transcription = getattr(
                        content, "input_transcription", None
                    )
                    if input_transcription and input_transcription.text:
                        transcript_count += 1
                        await send_browser({
                            "type": "transcript",
                            "speaker": "customer",
                            "text": input_transcription.text,
                        })

                    output_transcription = getattr(
                        content, "output_transcription", None
                    )
                    if output_transcription and output_transcription.text:
                        transcript_count += 1
                        await send_browser({
                            "type": "transcript",
                            "speaker": "agent",
                            "text": output_transcription.text,
                        })

                    if content.model_turn:
                        for part in content.model_turn.parts:
                            if part.inline_data and part.inline_data.data:
                                audio_count += 1
                                await send_browser({
                                    "type": "audio",
                                    "data": base64.b64encode(
                                        part.inline_data.data
                                    ).decode("ascii"),
                                    "mimeType": part.inline_data.mime_type,
                                })

                    if getattr(content, "turn_complete", False):
                        print(
                            "GEMINI TURN COMPLETE "
                            f"(responses={response_count}, "
                            f"audio_chunks={audio_count}, "
                            f"transcript_segments={transcript_count})",
                            flush=True,
                        )

                print(
                    f"GEMINI RECEIVE CYCLE ENDED "
                    f"(responses_in_cycle={turn_responses})",
                    flush=True,
                )

                # An empty cycle means the receive stream ended.
                # Do not spin forever or silently pretend the call is alive.
                if turn_responses == 0:
                    print(
                        "GEMINI RECEIVE STREAM ENDED WITHOUT RESPONSES",
                        flush=True,
                    )
                    return

        except asyncio.CancelledError:
            raise

        except Exception:
            print("GEMINI RESPONSE RECEIVER FAILED:", flush=True)
            traceback.print_exc()
            raise

        finally:
            print(
                "GEMINI RESPONSE RECEIVER EXITED "
                f"(responses={response_count}, "
                f"audio_chunks={audio_count}, "
                f"transcript_segments={transcript_count})",
                flush=True,
            )

    try:
        client = create_gemini_client()

        config = {
            "response_modalities": ["AUDIO"],
            "input_audio_transcription": {},
            "output_audio_transcription": {},
            "system_instruction": SALES_INSTRUCTIONS,
        }

        print(
            f"Connecting to Gemini Live model: {GEMINI_LIVE_MODEL}",
            flush=True,
        )

        async with client.aio.live.connect(
            model=GEMINI_LIVE_MODEL,
            config=config,
        ) as session:
            print("GEMINI LIVE SESSION CONNECTED", flush=True)
            await send_browser({"type": "ready"})

            sender_task = asyncio.create_task(
                receive_browser_messages(session),
                name="browser_sender",
            )
            receiver_task = asyncio.create_task(
                receive_gemini_responses(session),
                name="gemini_receiver",
            )

            done, pending = await asyncio.wait(
                {sender_task, receiver_task},
                return_when=asyncio.FIRST_COMPLETED,
            )

            # Log the task that finished first before cleaning up.
            for task in done:
                if task.cancelled():
                    print(
                        f"VOICE TASK CANCELLED: {task.get_name()}",
                        flush=True,
                    )
                    continue

                exception = task.exception()
                print(
                    f"VOICE TASK FINISHED: {task.get_name()} "
                    f"exception={exception!r}",
                    flush=True,
                )

            # A finished sender means the browser requested an end or
            # disconnected. A finished receiver means Gemini's stream ended.
            # Either way, this session is no longer safe to keep running.
            for task in pending:
                task.cancel()

            for task in pending:
                with contextlib.suppress(
                    asyncio.CancelledError, Exception
                ):
                    await task

    except WebSocketDisconnect:
        print("BROWSER DISCONNECTED FROM VOICEPILOT", flush=True)

    except asyncio.CancelledError:
        raise

    except Exception as exc:
        print(
            f"VOICE SESSION ERROR: {type(exc).__name__}: {exc}",
            flush=True,
        )
        traceback.print_exc()

        await send_browser({
            "type": "error",
            "message": f"{type(exc).__name__}: {exc}",
        })

    finally:
        client_connected = False

        for task in (sender_task, receiver_task):
            if task and not task.done():
                task.cancel()

        for task in (sender_task, receiver_task):
            if task:
                with contextlib.suppress(
                    asyncio.CancelledError, Exception
                ):
                    await task

        with contextlib.suppress(Exception):
            await websocket.close()

        print("VOICE SESSION CLEANUP COMPLETE", flush=True)




