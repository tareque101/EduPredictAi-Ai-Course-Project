import logging
import os

import requests
from flask import Blueprint, jsonify, request

logger = logging.getLogger("edupredict")
bp = Blueprint("chat", __name__, url_prefix="/api")

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MAX_HISTORY = 10
MAX_CHARS = 1000
RETRYABLE_STATUS = {429, 500, 502, 503, 504}

# Free model IDs (suffix ":free"). Verify on https://openrouter.ai/models?max_price=0
# and override with OPENROUTER_MODELS in .env (comma-separated, first = preferred).
DEFAULT_FREE_MODELS = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-3-27b-it:free",
]

SYSTEM_PROMPT = """You are the study assistant of EduPredict AI, a student performance website.

You help students with study planning, exam preparation, sleep and daily routine,
attendance, improving CGPA, extra-curricular activities, skills and general wellbeing.
You can explain how to use the website: Home, Dashboard, Habits, ECA, Skills, Health,
Analytics and Predict.

Rules:
- Keep answers short and practical. Use plain text only: no asterisks, no markdown, no horizontal lines.
- A CGPA prediction is an estimate, never a guarantee.
- You are not a doctor. For health concerns, suggest a doctor or counselor.
- If a student mentions self-harm or hopelessness, encourage them to talk to a trusted person or a local helpline now.
- For questions unrelated to studies or this website, politely say you can only help with study and EduPredict topics.
- Reply in the same language the student uses (English or Bangla)."""


def free_model_list():
    raw = os.getenv("OPENROUTER_MODELS", "")
    models = [m.strip() for m in raw.split(",") if m.strip()] or DEFAULT_FREE_MODELS
    # Paid-model guard: only ":free" IDs (or the openrouter/free router) are ever called.
    safe = [m for m in models if m.endswith(":free") or m == "openrouter/free"]
    rejected = [m for m in models if m not in safe]
    if rejected:
        logger.warning("Skipping non-free models: %s", rejected)
    return safe


def clean_history(raw):
    history = []
    for item in (raw or [])[-MAX_HISTORY:]:
        if not isinstance(item, dict):
            continue
        role = item.get("role")
        content = str(item.get("content", "")).strip()[:MAX_CHARS]
        if role in ("user", "assistant") and content:
            history.append({"role": role, "content": content})
    # The conversation context must start with a user turn
    while history and history[0]["role"] != "user":
        history.pop(0)
    return history


@bp.post("/chat")
def chat():
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        return jsonify(error="Chatbot is not configured on the server."), 503

    data = request.get_json(silent=True) or {}
    message = str(data.get("message", "")).strip()[:MAX_CHARS]
    if not message:
        return jsonify(error="'message' is required."), 400

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        *clean_history(data.get("history")),
        {"role": "user", "content": message},
    ]

    models = free_model_list()
    if not models:
        return jsonify(error="No free model is configured."), 503

    last_error = "unknown"
    for model in models:
        try:
            res = requests.post(
                OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:5173",
                    "X-Title": "EduPredict AI",
                },
                json={"model": model, "messages": messages, "max_tokens": 400, "temperature": 0.5},
                timeout=45,
            )
        except requests.Timeout:
            last_error = "timeout"
            logger.warning("Model %s timed out, trying next", model)
            continue
        except requests.RequestException as exc:
            last_error = "network"
            logger.warning("Model %s network error: %s", model, type(exc).__name__)
            continue

        if res.status_code in (401, 403):
            # Key problem: switching models will not fix this
            logger.error("OpenRouter rejected the API key (HTTP %s)", res.status_code)
            return jsonify(error="Chatbot key is invalid. Check OPENROUTER_API_KEY on the server."), 502

        if res.status_code == 429 and "per-day" in res.text:
            # Account-wide daily free quota: other free models will also fail
            logger.error("OpenRouter daily free quota reached for this account")
            return jsonify(
                error="Daily free AI limit reached for this server account. Try again after the daily reset, or add OpenRouter credits."
            ), 429

        if res.status_code in RETRYABLE_STATUS or not res.ok:
            last_error = f"HTTP {res.status_code}"
            logger.warning("Model %s returned %s, trying next", model, res.status_code)
            continue

        try:
            reply = res.json()["choices"][0]["message"]["content"].strip()
        except (KeyError, IndexError, TypeError, ValueError):
            last_error = "unexpected response"
            logger.warning("Model %s returned an unexpected body", model)
            continue

        if reply:
            return jsonify(reply=reply, model=model)

    logger.error("All free models failed. Last error: %s", last_error)
    return jsonify(error="The assistant is busy right now. Please try again in a moment."), 503