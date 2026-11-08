from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, List
from backend.app.voice.translation_engine import voice_engine

router = APIRouter(prefix="/voice", tags=["Multilingual Voice & Medical Speech Engine"])

class TranslationRequest(BaseModel):
    text: str
    target_language: str
    source_language: str = "en"

@router.get("/languages")
async def get_supported_languages():
    """Retrieve supported clinical translation languages."""
    return voice_engine.SUPPORTED_LANGUAGES

@router.get("/dictations")
async def get_sample_voice_dictations():
    """Retrieve sample medical speech dictations and structured clinical summaries."""
    return voice_engine.SAMPLE_DICTATIONS

@router.post("/translate")
async def translate_medical_content(req: TranslationRequest):
    """Translate clinical phrases and patient dialogue using local Ollama LLM while preserving safety constraints."""
    return await voice_engine.translate_medical_text(req.text, req.target_language, req.source_language)
