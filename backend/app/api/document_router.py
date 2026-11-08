from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, List
from backend.app.documents.document_ai import document_ai

router = APIRouter(prefix="/documents", tags=["Medical Document AI & OCR Extraction"])

class DocumentExtractionRequest(BaseModel):
    document_text: str

@router.get("/samples")
async def get_sample_clinical_documents():
    """Retrieve sample clinical notes and discharge summaries for extraction testing."""
    return document_ai.SAMPLE_DOCUMENTS

@router.post("/extract")
async def extract_entities(req: DocumentExtractionRequest):
    """Extract clinical entities, medications, and labs with strict contextual negation detection."""
    return document_ai.extract_entities_from_text(req.document_text)
