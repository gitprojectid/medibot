from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from backend.app.database.session import get_db
from backend.app.database.models import (
    User, PatientProfile, MedicalCondition, Medication, Allergy, VitalSign, Conversation, Message, ConsentRecord
)
from backend.app.auth.dependencies import get_current_user

router = APIRouter(prefix="/patient", tags=["Patient Management"])

class ProfileUpdateRequest(BaseModel):
    age: Optional[int] = None
    sex: Optional[str] = None
    is_pregnant: Optional[bool] = None
    pregnancy_weeks: Optional[int] = None
    preferred_language: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    notes: Optional[str] = None

class AddConditionRequest(BaseModel):
    condition_name: str
    diagnosed_year: Optional[int] = None
    severity: Optional[str] = "mild"
    notes: Optional[str] = None

class AddAllergyRequest(BaseModel):
    allergen_name: str
    reaction: Optional[str] = None
    severity: Optional[str] = "moderate"

class AddMedicationRequest(BaseModel):
    generic_name: str
    brand_names: Optional[List[str]] = []
    drug_class: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None

class AddVitalRequest(BaseModel):
    vital_type: str # bp_systolic, bp_diastolic, heart_rate, spo2, temperature, blood_glucose
    value: float
    unit: str
    source: str = "patient_entered"

@router.get("/profile")
async def get_profile(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PatientProfile)
        .where(PatientProfile.user_id == user.id)
        .options(
            selectinload(PatientProfile.conditions),
            selectinload(PatientProfile.medications),
            selectinload(PatientProfile.allergies),
            selectinload(PatientProfile.vitals)
        )
    )
    profile = result.scalars().first()
    if not profile:
        profile = PatientProfile(user_id=user.id)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

    return {
        "id": profile.id,
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "age": profile.age,
        "sex": profile.sex,
        "is_pregnant": profile.is_pregnant,
        "pregnancy_weeks": profile.pregnancy_weeks,
        "preferred_language": profile.preferred_language,
        "emergency_contact_name": profile.emergency_contact_name,
        "emergency_contact_phone": profile.emergency_contact_phone,
        "notes": profile.notes,
        "conditions": [{"id": c.id, "name": c.condition_name, "year": c.diagnosed_year, "severity": c.severity} for c in profile.conditions],
        "medications": [{"id": m.id, "generic_name": m.generic_name, "dosage": m.dosage, "frequency": m.frequency} for m in profile.medications],
        "allergies": [{"id": a.id, "allergen": a.allergen_name, "reaction": a.reaction, "severity": a.severity} for a in profile.allergies],
        "vitals": [{"id": v.id, "type": v.vital_type, "value": v.value, "unit": v.unit, "timestamp": v.measured_at} for v in profile.vitals]
    }

@router.put("/profile")
async def update_profile(
    req: ProfileUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(PatientProfile).where(PatientProfile.user_id == user.id))
    profile = result.scalars().first()
    if not profile:
        profile = PatientProfile(user_id=user.id)
        db.add(profile)

    if req.age is not None: profile.age = req.age
    if req.sex is not None: profile.sex = req.sex
    if req.is_pregnant is not None: profile.is_pregnant = req.is_pregnant
    if req.pregnancy_weeks is not None: profile.pregnancy_weeks = req.pregnancy_weeks
    if req.preferred_language is not None: profile.preferred_language = req.preferred_language
    if req.emergency_contact_name is not None: profile.emergency_contact_name = req.emergency_contact_name
    if req.emergency_contact_phone is not None: profile.emergency_contact_phone = req.emergency_contact_phone
    if req.notes is not None: profile.notes = req.notes

    await db.commit()
    return {"status": "success", "message": "Profile updated"}

@router.post("/allergies")
async def add_allergy(
    req: AddAllergyRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(PatientProfile).where(PatientProfile.user_id == user.id))
    profile = result.scalars().first()
    allergy = Allergy(
        patient_profile_id=profile.id,
        allergen_name=req.allergen_name,
        reaction=req.reaction,
        severity=req.severity
    )
    db.add(allergy)
    await db.commit()
    return {"status": "success", "id": allergy.id}

@router.delete("/allergies/{allergy_id}")
async def delete_allergy(
    allergy_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await db.execute(delete(Allergy).where(Allergy.id == allergy_id))
    await db.commit()
    return {"status": "deleted"}

@router.post("/medications")
async def add_medication(
    req: AddMedicationRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(PatientProfile).where(PatientProfile.user_id == user.id))
    profile = result.scalars().first()
    med = Medication(
        patient_profile_id=profile.id,
        generic_name=req.generic_name,
        brand_names=req.brand_names or [],
        drug_class=req.drug_class,
        dosage=req.dosage,
        frequency=req.frequency
    )
    db.add(med)
    await db.commit()
    return {"status": "success", "id": med.id}

@router.delete("/medications/{med_id}")
async def delete_medication(
    med_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await db.execute(delete(Medication).where(Medication.id == med_id))
    await db.commit()
    return {"status": "deleted"}

@router.post("/conditions")
async def add_condition(
    req: AddConditionRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(PatientProfile).where(PatientProfile.user_id == user.id))
    profile = result.scalars().first()
    cond = MedicalCondition(
        patient_profile_id=profile.id,
        condition_name=req.condition_name,
        diagnosed_year=req.diagnosed_year,
        severity=req.severity,
        notes=req.notes
    )
    db.add(cond)
    await db.commit()
    return {"status": "success", "id": cond.id}

@router.delete("/conditions/{cond_id}")
async def delete_condition(
    cond_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await db.execute(delete(MedicalCondition).where(MedicalCondition.id == cond_id))
    await db.commit()
    return {"status": "deleted"}

@router.post("/vitals")
async def record_vital(
    req: AddVitalRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(PatientProfile).where(PatientProfile.user_id == user.id))
    profile = result.scalars().first()
    vital = VitalSign(
        patient_profile_id=profile.id,
        vital_type=req.vital_type,
        value=req.value,
        unit=req.unit,
        source=req.source
    )
    db.add(vital)
    await db.commit()
    return {"status": "success", "id": vital.id}

@router.get("/conversations")
async def list_conversations(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == user.id)
        .order_by(Conversation.created_at.desc())
    )
    convs = result.scalars().all()
    return [{"id": c.id, "title": c.title, "language": c.language, "created_at": c.created_at} for c in convs]

@router.get("/conversations/{conv_id}")
async def get_conversation_history(
    conv_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conv_id)
        .order_by(Message.created_at.asc())
    )
    messages = result.scalars().all()
    return [
        {
            "id": m.id,
            "role": m.sender_role,
            "content": m.content,
            "triage_level": m.triage_level,
            "is_emergency": m.is_emergency,
            "metadata": m.metadata_json,
            "created_at": m.created_at
        }
        for m in messages
    ]
