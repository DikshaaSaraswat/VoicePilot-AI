
import os
from contextlib import asynccontextmanager
from pathlib import Path
import json
import sqlite3
import uuid

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, WebSocket, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from voice_session import handle_voice_websocket
from call_analysis import analyze_call

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
DB_PATH = BASE_DIR / "voicepilot.db"
RECORDINGS_DIR = BASE_DIR / "recordings"
RECORDINGS_DIR.mkdir(parents=True, exist_ok=True)


def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    with get_connection() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS calls (
                id TEXT PRIMARY KEY,
                customer_name TEXT NOT NULL,
                phone_number TEXT NOT NULL,
                product_id TEXT NOT NULL,
                language TEXT NOT NULL,
                started_at TEXT NOT NULL,
                duration_seconds INTEGER NOT NULL DEFAULT 0,
                sales_status TEXT NOT NULL,
                summary TEXT NOT NULL DEFAULT '',
                transcript TEXT NOT NULL DEFAULT '[]',
                is_simulated INTEGER NOT NULL DEFAULT 1,
                analysis_json TEXT NOT NULL DEFAULT '{}'
            )
        """)

        columns = {
            row["name"]
            for row in connection.execute(
                "PRAGMA table_info(calls)"
            ).fetchall()
        }

        if "analysis_json" not in columns:
            connection.execute("""
                ALTER TABLE calls
                ADD COLUMN analysis_json TEXT NOT NULL DEFAULT '{}'
            """)


@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    yield


app = FastAPI(title="VoicePilot AI Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TranscriptLine(BaseModel):
    speaker: str
    text: str
    offsetSeconds: int = 0


class CallLogRequest(BaseModel):
    customer_name: str
    phone_number: str
    product_id: str
    language: str
    started_at: str
    duration_seconds: int = Field(ge=0)
    sales_status: str
    summary: str = ""
    transcript: list[TranscriptLine] = Field(default_factory=list)
    is_simulated: bool = True


class CallUpdateRequest(BaseModel):
    sales_status: str | None = None
    summary: str | None = None


def serialize_call(row):
    call_id = row["id"]
    recording_path = RECORDINGS_DIR / f"{call_id}.webm"

    return {
        "id": call_id,
        "customerName": row["customer_name"],
        "phone": row["phone_number"],
        "productId": row["product_id"],
        "language": row["language"],
        "startedAt": row["started_at"],
        "durationSeconds": row["duration_seconds"],
        "salesStatus": row["sales_status"],
        "summary": row["summary"],
        "analysis": json.loads(row["analysis_json"]),
        "transcript": json.loads(row["transcript"]),
        "recordingUrl": (
            f"/api/calls/{call_id}/recording"
            if recording_path.is_file()
            else None
        ),
        "source": "simulated" if row["is_simulated"] else "live",
    }


@app.get("/")
def home():
    return {"message": "VoicePilot AI backend is running!"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "1.0.0"}


@app.websocket("/ws/voice")
async def voice_websocket(websocket: WebSocket):
    await handle_voice_websocket(websocket)


@app.get("/api/calls")
def list_calls():
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT * FROM calls ORDER BY started_at DESC"
        ).fetchall()

    return [serialize_call(row) for row in rows]


@app.get("/api/calls/{call_id}")
def get_call(call_id: str):
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM calls WHERE id = ?", (call_id,)
        ).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="Call not found")

    return serialize_call(row)


@app.post("/api/calls/logs", status_code=201)
def save_call_log(payload: CallLogRequest):
    call_id = str(uuid.uuid4())

    with get_connection() as connection:
        connection.execute("""
            INSERT INTO calls (
                id, customer_name, phone_number, product_id, language,
                started_at, duration_seconds, sales_status, summary,
                transcript, is_simulated, analysis_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            call_id,
            payload.customer_name,
            payload.phone_number,
            payload.product_id,
            payload.language,
            payload.started_at,
            payload.duration_seconds,
            payload.sales_status,
            payload.summary,
            json.dumps([
                line.model_dump() for line in payload.transcript
            ]),
            int(payload.is_simulated),
            "{}",
        ))

    return {"id": call_id}


@app.post("/api/calls/{call_id}/recording", status_code=201)
async def upload_call_recording(
    call_id: str,
    recording: UploadFile = File(...),
):
    with get_connection() as connection:
        row = connection.execute(
            "SELECT id FROM calls WHERE id = ?", (call_id,)
        ).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="Call not found")

    if recording.content_type not in {
        "audio/webm",
        "audio/webm;codecs=opus",
        "application/octet-stream",
    }:
        raise HTTPException(
            status_code=415,
            detail="Unsupported recording format. Upload a WebM audio file.",
        )

    destination = RECORDINGS_DIR / f"{call_id}.webm"

    try:
        with destination.open("wb") as output:
            while chunk := await recording.read(1024 * 1024):
                output.write(chunk)
    except Exception:
        destination.unlink(missing_ok=True)
        raise HTTPException(
            status_code=500,
            detail="Could not save the call recording.",
        )
    finally:
        await recording.close()

    return {"call_id": call_id, "recording_url": f"/api/calls/{call_id}/recording"}


@app.get("/api/calls/{call_id}/recording")
def get_call_recording(call_id: str):
    with get_connection() as connection:
        row = connection.execute(
            "SELECT id FROM calls WHERE id = ?", (call_id,)
        ).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="Call not found")

    recording_path = RECORDINGS_DIR / f"{call_id}.webm"

    if not recording_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="No recording is available for this call.",
        )

    return FileResponse(
        path=recording_path,
        media_type="audio/webm",
        filename=f"voicepilot-call-{call_id}.webm",
    )


@app.post("/api/calls/{call_id}/analyze")
def analyze_saved_call(call_id: str):
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM calls WHERE id = ?", (call_id,)
        ).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="Call not found")

    try:
        transcript = json.loads(row["transcript"])
    except (json.JSONDecodeError, TypeError):
        raise HTTPException(
            status_code=400,
            detail="The saved transcript is invalid.",
        )

    if not transcript:
        raise HTTPException(
            status_code=400,
            detail="This call has no transcript to analyze.",
        )

    try:
        analysis = analyze_call(
            transcript=transcript,
            product_name=row["product_id"] or "TaskFlow AI",
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception:
        raise HTTPException(
            status_code=502,
            detail=(
                "Gemini analysis failed. Check the backend terminal "
                "and API configuration."
            ),
        )

    with get_connection() as connection:
        connection.execute("""
            UPDATE calls
            SET summary = ?,
                sales_status = ?,
                analysis_json = ?
            WHERE id = ?
        """, (
            analysis.get("summary", ""),
            analysis.get("salesStatus", row["sales_status"]),
            json.dumps(analysis, ensure_ascii=False),
            call_id,
        ))

        updated_row = connection.execute(
            "SELECT * FROM calls WHERE id = ?", (call_id,)
        ).fetchone()

    return serialize_call(updated_row)


@app.patch("/api/calls/{call_id}")
def update_call(call_id: str, payload: CallUpdateRequest):
    changes = payload.model_dump(
        exclude_unset=True,
        exclude_none=True,
    )

    if not changes:
        raise HTTPException(
            status_code=400,
            detail="No changes supplied",
        )

    allowed_columns = {
        "sales_status": "sales_status",
        "summary": "summary",
    }

    assignments = []
    values = []

    for field, value in changes.items():
        column = allowed_columns[field]
        assignments.append(f"{column} = ?")
        values.append(value)

    values.append(call_id)

    with get_connection() as connection:
        cursor = connection.execute(
            f"UPDATE calls SET {', '.join(assignments)} WHERE id = ?",
            values,
        )

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Call not found",
            )

        row = connection.execute(
            "SELECT * FROM calls WHERE id = ?", (call_id,)
        ).fetchone()

    return serialize_call(row)





