import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from backend.app.database.session import get_db
from backend.app.database.models import User, Escalation, Conversation, Message, PatientProfile
from backend.app.auth.dependencies import require_clinician
from backend.app.ai.prompts.system_prompts import MEDICAL_SUMMARY_PROMPT
from backend.app.ai.providers.ollama_provider import ollama_provider

router = APIRouter(prefix="/clinician", tags=["Clinician Portal"])

class UpdateEscalationRequest(BaseModel):
    clinician_notes: Optional[str] = None
    status: Optional[str] = "under_review" # pending, under_review, resolved, dismissed

class GenerateSummaryRequest(BaseModel):
    conversation_id: str

@router.get("/escalations")
async def get_escalations(
    clinician: User = Depends(require_clinician),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Escalation)
        .order_by(Escalation.triage_level.desc(), Escalation.created_at.desc())
    )
    escalations = result.scalars().all()
    
    out = []
    for esc in escalations:
        patient_res = await db.execute(select(User).where(User.id == esc.patient_id))
        patient = patient_res.scalars().first()
        out.append({
            "id": esc.id,
            "conversation_id": esc.conversation_id,
            "patient_id": esc.patient_id,
            "patient_name": patient.full_name if patient else "Anonymous Patient",
            "patient_email": patient.email if patient else "",
            "reason": esc.reason,
            "triage_level": esc.triage_level,
            "status": esc.status,
            "clinical_summary": esc.clinical_summary,
            "clinician_notes": esc.clinician_notes,
            "created_at": esc.created_at,
            "resolved_at": esc.resolved_at
        })
    return out

@router.get("/escalations/{escalation_id}")
async def get_escalation_detail(
    escalation_id: str,
    clinician: User = Depends(require_clinician),
    db: AsyncSession = Depends(get_db)
):
    esc_res = await db.execute(select(Escalation).where(Escalation.id == escalation_id))
    esc = esc_res.scalars().first()
    if not esc:
        raise HTTPException(status_code=404, detail="Escalation not found")

    # Fetch patient profile & vitals
    prof_res = await db.execute(
        select(PatientProfile)
        .where(PatientProfile.user_id == esc.patient_id)
        .options(
            selectinload(PatientProfile.conditions),
            selectinload(PatientProfile.medications),
            selectinload(PatientProfile.allergies),
            selectinload(PatientProfile.vitals)
        )
    )
    profile = prof_res.scalars().first()

    # Fetch messages
    msg_res = await db.execute(
        select(Message)
        .where(Message.conversation_id == esc.conversation_id)
        .order_by(Message.created_at.asc())
    )
    messages = msg_res.scalars().all()

    return {
        "escalation": {
            "id": esc.id,
            "reason": esc.reason,
            "triage_level": esc.triage_level,
            "status": esc.status,
            "clinical_summary": esc.clinical_summary,
            "clinician_notes": esc.clinician_notes,
            "created_at": esc.created_at
        },
        "patient": {
            "age": profile.age if profile else None,
            "sex": profile.sex if profile else None,
            "is_pregnant": profile.is_pregnant if profile else False,
            "conditions": [c.condition_name for c in profile.conditions] if profile else [],
            "medications": [f"{m.generic_name} ({m.dosage})" for m in profile.medications] if profile else [],
            "allergies": [a.allergen_name for a in profile.allergies] if profile else [],
            "vitals": [{"type": v.vital_type, "value": v.value, "unit": v.unit} for v in profile.vitals] if profile else []
        },
        "timeline": [
            {
                "id": m.id,
                "role": m.sender_role,
                "content": m.content,
                "triage_level": m.triage_level,
                "is_emergency": m.is_emergency,
                "timestamp": m.created_at
            }
            for m in messages
        ]
    }

@router.post("/escalations/{escalation_id}/notes")
async def update_escalation_notes(
    escalation_id: str,
    req: UpdateEscalationRequest,
    clinician: User = Depends(require_clinician),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Escalation).where(Escalation.id == escalation_id))
    esc = result.scalars().first()
    if not esc:
        raise HTTPException(status_code=404, detail="Escalation not found")

    if req.clinician_notes is not None:
        esc.clinician_notes = req.clinician_notes
    if req.status:
        esc.status = req.status
        if req.status == "resolved":
            esc.resolved_at = datetime.datetime.utcnow()

    esc.reviewed_by_clinician_id = clinician.id
    await db.commit()
    return {"status": "success", "escalation_status": esc.status}

@router.post("/medical-summary")
async def generate_summary(
    req: GenerateSummaryRequest,
    clinician: User = Depends(require_clinician),
    db: AsyncSession = Depends(get_db)
):
    # Fetch messages
    msg_res = await db.execute(
        select(Message)
        .where(Message.conversation_id == req.conversation_id)
        .order_by(Message.created_at.asc())
    )
    messages = msg_res.scalars().all()
    transcript = "\n".join([f"{m.sender_role.upper()}: {m.content}" for m in messages])

    llm_prompt = f"Summarize the following patient consultation for clinician review:\n\n{transcript}"
    summary = await ollama_provider.chat([
        {"role": "system", "content": MEDICAL_SUMMARY_PROMPT},
        {"role": "user", "content": llm_prompt}
    ], temperature=0.1)

    return {
        "conversation_id": req.conversation_id,
        "summary": summary,
        "generated_at": datetime.datetime.utcnow().isoformat()
    }
