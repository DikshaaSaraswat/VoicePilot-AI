
import json
from google import genai
from google.genai import types

from gemini_live import create_gemini_client


ALLOWED_STATUSES = {
    "Converted",
    "Interested",
    "Follow-up Required",
    "Not Interested",
    "Demo Requested",
    "No Response",
}


def analyze_call(transcript: list[dict], product_name: str = "TaskFlow AI") -> dict:
    if not transcript:
        raise ValueError("A transcript is required to analyze a call.")

    conversation = "\n".join(
        f"{line.get('speaker', 'unknown')}: {line.get('text', '')}"
        for line in transcript
        if line.get("text", "").strip()
    )

    if not conversation.strip():
        raise ValueError("The transcript contains no readable conversation.")

    client = create_gemini_client()

    prompt = f"""
You are a careful sales-call analyst for a fictional SaaS product.
Analyze the actual conversation below. Never invent facts or infer
buying intent without evidence. If information is missing, say so.

Product: {product_name}

Conversation:
{conversation}

Return ONLY valid JSON with exactly these fields:
{{
  "summary": "A concise factual summary of the conversation",
  "requirements": ["Customer needs explicitly mentioned"],
  "objections": ["Concerns or objections explicitly mentioned"],
  "sentiment": "Positive, Neutral, or Negative",
  "sentimentScore": 0,
  "nextSteps": ["Practical recommended actions"],
  "followUpDate": "",
  "salesStatus": "One allowed status"
}}

Rules:
- sentimentScore must be an integer from 0 to 100.
- salesStatus must be exactly one of:
  Converted, Interested, Follow-up Required, Not Interested,
  Demo Requested, No Response.
- Choose Converted only when the customer clearly confirms a purchase.
- Choose Demo Requested only when the customer requests a demo.
- Choose Not Interested only when the customer clearly declines.
- Choose No Response when there is no meaningful customer response.
- Otherwise choose the best evidence-based status.
- Use empty arrays when no requirements or objections are evident.
- Do not treat the AI agent's statements as customer requirements.
- Use an empty string for followUpDate when no date was agreed.
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.2,
        ),
    )

    if not response.text:
        raise RuntimeError("Gemini returned an empty analysis.")

    try:
        result = json.loads(response.text)
    except json.JSONDecodeError as exc:
        raise RuntimeError("Gemini returned invalid analysis JSON.") from exc

    if result.get("sentiment") not in {"Positive", "Neutral", "Negative"}:
        result["sentiment"] = "Neutral"

    try:
        result["sentimentScore"] = max(
            0, min(100, int(result.get("sentimentScore", 50)))
        )
    except (TypeError, ValueError):
        result["sentimentScore"] = 50

    if result.get("salesStatus") not in ALLOWED_STATUSES:
        result["salesStatus"] = "Follow-up Required"

    for field in ("requirements", "objections", "nextSteps"):
        if not isinstance(result.get(field), list):
            result[field] = []

    for field in ("summary", "followUpDate"):
        if not isinstance(result.get(field), str):
            result[field] = ""

    return result
