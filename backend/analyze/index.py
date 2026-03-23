"""
Анализ текста на оригинальность, ИИ-генерацию и плагиат.
Принимает текст, возвращает детальный отчёт по каждому предложению.
"""
import os
import json
import re
from openai import OpenAI


def split_sentences(text: str) -> list[str]:
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    return [s.strip() for s in sentences if s.strip()]


def handler(event: dict, context) -> dict:
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    if event.get("httpMethod") != "POST":
        return {"statusCode": 405, "headers": headers, "body": json.dumps({"error": "Method not allowed"})}

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Invalid JSON"})}

    text = body.get("text", "").strip()
    if not text:
        return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Text is required"})}

    if len(text) > 50000:
        return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Text too long (max 50000 chars)"})}

    sentences = split_sentences(text)
    if not sentences:
        return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "No sentences found"})}

    sentences = sentences[:30]

    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

    sentences_json = json.dumps(sentences, ensure_ascii=False)

    prompt = f"""Ты — эксперт по анализу текста. Твоя задача — определить для каждого предложения:
- написано ли оно человеком ("original"),
- сгенерировано нейросетью ("ai"),
- или является плагиатом из известных источников ("plagiat").

Верни ТОЛЬКО валидный JSON следующей структуры (без пояснений, без markdown):
{{
  "sentences": [
    {{
      "text": "текст предложения",
      "status": "original" | "ai" | "plagiat",
      "confidence": число от 70 до 99
    }}
  ]
}}

Предложения для анализа:
{sentences_json}

Правила:
- "confidence" — уверенность модели в процентах (70–99)
- Анализируй стиль, лексику, структуру, клише, шаблонность
- ИИ-тексты обычно слишком гладкие, без личных деталей, с общими фразами
- Авторский текст содержит личные детали, эмоции, нестандартные обороты
- Плагиат — дословные или почти дословные совпадения с известными источниками"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=4000,
    )

    raw = response.choices[0].message.content.strip()

    raw = re.sub(r"```json\s*", "", raw)
    raw = re.sub(r"```\s*", "", raw)

    result = json.loads(raw)
    analyzed = result.get("sentences", [])

    total = len(analyzed)
    ai_count = sum(1 for s in analyzed if s.get("status") == "ai")
    plagiat_count = sum(1 for s in analyzed if s.get("status") == "plagiat")
    original_count = sum(1 for s in analyzed if s.get("status") == "original")

    originality_score = round((original_count / total) * 100) if total else 0
    ai_score = round((ai_count / total) * 100) if total else 0
    plagiat_score = round((plagiat_count / total) * 100) if total else 0

    return {
        "statusCode": 200,
        "headers": headers,
        "body": json.dumps({
            "originalityScore": originality_score,
            "aiScore": ai_score,
            "plagiatScore": plagiat_score,
            "sentences": analyzed,
        }, ensure_ascii=False),
    }
