from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, Optional
from backend.app.governance.governance_engine import governance_engine

router = APIRouter(prefix="/governance", tags=["AI Governance, Red-Teaming & MLOps"])

class IncidentReportRequest(BaseModel):
    reported_by: str
    incident_type: str
    details: str
    severity: str = "Low"

@router.get("/status")
async def get_governance_status():
    """Retrieve Model Cards, Adversarial Red-Team Benchmark status, and Failsafe configuration."""
    return governance_engine.get_governance_report()

@router.post("/incidents")
async def report_ai_incident(req: IncidentReportRequest):
    """Log an AI safety observation, hallucination report, or incident."""
    new_inc = {
        "id": f"inc-{len(governance_engine.INCIDENTS_LOG) + 101}",
        "timestamp": "2026-08-30T13:00:00Z",
        "reported_by": req.reported_by,
        "incident_type": req.incident_type,
        "details": req.details,
        "resolution": "Under Review by Clinical Governance Committee",
        "severity": req.severity
    }
    governance_engine.INCIDENTS_LOG.insert(0, new_inc)
    return {"status": "success", "incident": new_inc}
