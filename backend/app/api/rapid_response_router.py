from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.app.clinical.rapid_response_engine import rapid_response_engine

router = APIRouter(prefix="/rapid-response", tags=["Rapid Response Team & Code Blue Dispatch"])

class TriggerEmergencyRequest(BaseModel):
    patient_id: str
    event_type: str # RAPID_RESPONSE_DETERIORATION, CODE_BLUE_CARDIAC_ARREST, CODE_SEPSIS_BUNDLE
    caller_name: str
    trigger_reason: str
    bedside_location: Optional[str] = None

class ResolveEmergencyRequest(BaseModel):
    event_id: str
    resolved_by: str
    outcome_status: str # STABILIZED, ICU_TRANSFERRED, CODE_TERMINATED
    outcome_notes: str

@router.get("/events")
async def get_emergency_events():
    """Retrieve all active and recent hospital emergency dispatch tickets."""
    return rapid_response_engine.get_active_events()

@router.post("/trigger")
async def trigger_rapid_response_team(req: TriggerEmergencyRequest):
    """Trigger a hospital-wide Rapid Response Team or Code Blue alert with resuscitation checklist."""
    return rapid_response_engine.trigger_emergency_event(
        patient_id=req.patient_id,
        event_type=req.event_type,
        caller_name=req.caller_name,
        trigger_reason=req.trigger_reason,
        bedside_location=req.bedside_location
    )

@router.post("/resolve")
async def resolve_emergency_case(req: ResolveEmergencyRequest):
    """Record clinical disposition and outcome notes for an emergency resuscitation event."""
    res = rapid_response_engine.resolve_emergency_event(
        event_id=req.event_id,
        resolved_by=req.resolved_by,
        outcome_status=req.outcome_status,
        outcome_notes=req.outcome_notes
    )
    if res.get("status") == "error":
        raise HTTPException(status_code=404, detail=res["message"])
    return res
