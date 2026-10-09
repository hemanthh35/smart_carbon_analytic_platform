"""Generates a plain-English compliance narrative from a prediction's structured output,
using a local, open-source LLM served by Ollama (llama3.2:3b by default) — fully
offline, no API key, no per-call cost, and no facility data ever leaves the machine.

This is deliberately NOT used to produce the emissions number itself — the BiLSTM (or
its surrogate) remains the sole source of the numeric prediction. The LLM's only job is
to turn already-computed numbers into a readable paragraph for auditors and operators,
e.g. explaining what drove a specific result and whether anything about it looks
unusual, grounded entirely in the structured facts handed to it in the prompt.
"""
from __future__ import annotations

import requests

from app.core.config import settings
from app.utils.logger import get_logger

logger = get_logger("services.narrative")

OLLAMA_API_KEY = settings.ollama_api_key.strip()
OLLAMA_URL = settings.ollama_url or (
    "https://ollama.com/api/chat" if OLLAMA_API_KEY else "http://localhost:11434/api/chat"
)
OLLAMA_MODEL = settings.ollama_model or (
    "gpt-oss:20b" if OLLAMA_API_KEY else "llama3.2:3b"
)
REQUEST_TIMEOUT_S = settings.ollama_timeout_seconds


def _build_prompt(
    facility_name: str,
    country: str | None,
    predicted_emission: float,
    baseline_emission: float | None,
    credits: float | None,
    top_features: list[dict] | None,
    anomaly: dict | None,
) -> str:
    lines = [
        "You are a carbon-compliance assistant. Write a concise, factual 3-4 sentence "
        "summary for an auditor reviewing this single facility prediction. Use only the "
        "facts given below — do not invent numbers, units, or facility details that are "
        "not listed. Do not speculate beyond what the data supports.",
        "",
        f"Facility: {facility_name}" + (f" ({country})" if country else ""),
        f"Predicted emissions (next period): {predicted_emission:.2f} t CO2",
    ]
    if baseline_emission is not None:
        lines.append(f"Baseline emissions: {baseline_emission:.2f} t CO2")
    if credits is not None:
        lines.append(f"Carbon credits issued: {credits:.2f}")
    if top_features:
        feat_str = ", ".join(
            f"{f['feature']} ({'+' if f['shap_value'] >= 0 else ''}{f['shap_value']:.3f})"
            for f in top_features[:4]
        )
        lines.append(f"Top model-identified drivers (BiLSTM feature attribution): {feat_str}")
    if anomaly is not None:
        status = "FLAGGED AS ANOMALOUS" if anomaly.get("is_anomalous") else "within normal range"
        lines.append(f"Anomaly check: {status} (raw score {anomaly.get('anomaly_score', 0):.3f})")
    lines.append("")
    lines.append("Summary:")
    return "\n".join(lines)


def generate_narrative(
    facility_name: str,
    country: str | None,
    predicted_emission: float,
    baseline_emission: float | None = None,
    credits: float | None = None,
    top_features: list[dict] | None = None,
    anomaly: dict | None = None,
) -> str | None:
    """Returns the generated narrative text, or None if Ollama is unreachable (caller
    should degrade gracefully — this is a supplementary feature, not core functionality)."""
    prompt = _build_prompt(
        facility_name, country, predicted_emission, baseline_emission, credits, top_features, anomaly
    )
    try:
        headers = {"Content-Type": "application/json"}
        if OLLAMA_API_KEY:
            headers["Authorization"] = f"Bearer {OLLAMA_API_KEY}"

        resp = requests.post(
            OLLAMA_URL,
            headers=headers,
            json={
                "model": OLLAMA_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "stream": False,
            },
            timeout=REQUEST_TIMEOUT_S,
        )
        resp.raise_for_status()
        return resp.json().get("message", {}).get("content", "").strip()
    except requests.exceptions.RequestException as e:
        logger.warning(f"Ollama narrative generation unavailable: {e}")
        return None
