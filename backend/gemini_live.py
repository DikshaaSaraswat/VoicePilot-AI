
import os
import asyncio
from pathlib import Path

from dotenv import load_dotenv
from google import genai

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

GEMINI_LIVE_MODEL = os.getenv(
    "GEMINI_LIVE_MODEL",
    "gemini-2.5-flash-native-audio-latest",
)


def create_gemini_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is missing. Check backend/.env.")
    return genai.Client(api_key=api_key)


async def test_live_connection() -> str:
    client = create_gemini_client()
    audio_bytes = bytearray()

    async with client.aio.live.connect(
        model=GEMINI_LIVE_MODEL,
        config={"response_modalities": ["AUDIO"]},
    ) as session:
        await session.send_realtime_input(
            text="Say clearly: VoicePilot live audio works!"
        )

        async for response in session.receive():
            content = response.server_content
            if not content:
                continue

            if content.model_turn:
                for part in content.model_turn.parts:
                    if part.inline_data and part.inline_data.data:
                        audio_bytes.extend(part.inline_data.data)

            if content.turn_complete:
                break

    if audio_bytes:
        output_path = BASE_DIR / "live_test_audio.pcm"
        output_path.write_bytes(audio_bytes)
        return f"Success! Received {len(audio_bytes)} audio bytes. Saved to {output_path}"

    return "No audio bytes received. Check the Live API response."


