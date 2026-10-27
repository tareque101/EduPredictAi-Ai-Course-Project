import logging
import os

import requests
from flask import Blueprint, jsonify, request

logger = logging.getLogger("edupredict")
bp = Blueprint("chat", __name__, url_prefix="/api")

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "meta-llama/llama-3.3-70b-instruct:free"

SYSTEM_PROMPT = """You are the study assistant of EduPredict AI, a student performance website.

You help students with:
- Study planning, time management, exam preparation
- Sleep, daily routine and habit building
- Attendance and improving CGPA
- Extra-curricular activities (ECA) and skill development
- General wellbeing tips

When asked, explain how to use the website: Home, Dashboard, My Habits, My ECA, My Skills, My Health, Analytics, and Predict (CGPA estimate).

Rules:
- Keep answers short, practical and friendly. Use bullet points for steps.
- The CGPA prediction is an estimate, never a guarantee. Do not promise a grade.
- You are not a doctor. For health concerns, suggest seeing a doctor or counselor.
- If a student mentions self-harm or feels hopeless, encourage them to talk to a trusted person or a local helpline right away.
- For questions unrelated to studies or this website, politely say you can only help with study and EduPredict topics.
- Reply in the same language the student uses (English or Bangla)."""


@bp.post("/chat")
def chat():
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        return jsonify(error="Chatbot is not configured. Set OPENROUTER_API_KEY on the server."), 503

    data = request.get_json(silent=True) or {}
    message = str(data.get("message", "")).strip()[:1000]
    if not message:
        return jsonify(error="'message' is required."), 400

    # Frontend-er history theke shudhu user/assistant message nei, sheshe 10-ta
    history = []
    for item in (data.get("history") or [])[-10:]:
        role = item.get("role")
        content = str(item.get("content", "")).strip()[:1000]
        if role in ("user", "assistant") and content:
            history.append({"role": role, "content": content})

    # Model user message-e shuru korte hobe; age-er welcome message bad dao
    while history and history[0]["role"] != "user":
        history.pop(0)

    messages = [{"role": "system", "content": SYSTEM_PROMPT}, *history,
                {"role": "user", "content": message}]

    try:
        res = requests.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "EduPredict AI",
            },
            json={
                "model": os.getenv("OPENROUTER_MODEL", DEFAULT_MODEL),
                "messages": messages,
                "max_tokens": 400,
                "temperature": 0.5,
            },
            timeout=30,
        )
        res.raise_for_status()
        reply = res.json()["choices"][0]["message"]["content"].strip()
    except requests.RequestException as exc:
        logger.error("OpenRouter request failed: %s", exc)
        return jsonify(error="Assistant is busy right now. Please try again in a moment."), 502
    except (KeyError, IndexError, ValueError):
        logger.error("Unexpected OpenRouter response")
        return jsonify(error="Unexpected response from the assistant."), 502

    return jsonify(reply=reply)