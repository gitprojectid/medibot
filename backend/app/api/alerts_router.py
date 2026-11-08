from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.app.clinical.alerts_engine import alerts_engine

router = APIRouter(prefix="/alerts", tags=["Hospital Clinical Alerts & Rapid Escalation"])

class AcknowledgeAlertRequest(BaseModel):
    alert_id: str
    clinician_name: str
    action_taken: Optional[str] = None

@router.get("/active")
async def get_active_alerts():
    """Retrieve all real-time patient deterioration and critical laboratory alerts across hospital wards."""
    return alerts_engine.get_active_hospital_alerts()

@router.post("/acknowledge")
async def acknowledge_clinical_alert(req: AcknowledgeAlertRequest):
    """1-click acknowledgment of clinical alert with timestamp and clinician notes."""
    return alerts_engine.acknowledge_alert(req.alert_id, req.clinician_name, req.action_taken)
