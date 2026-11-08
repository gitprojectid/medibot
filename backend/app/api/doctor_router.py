from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from backend.app.clinical.doctor_copilot import doctor_copilot

router = APIRouter(prefix="/doctor", tags=["Doctor AI Copilot & Decision Support"])

class SOAPDraftRequest(BaseModel):
    patient_id: str
    physician_notes: Optional[str] = None

class SOAPVerifyRequest(BaseModel):
    patient_id: str
    physician_name: str
    soap_content: Dict[str, str]

class CreatePatientRequest(BaseModel):
    full_name: str
    age: int
    gender: str
    dob: str
    blood_type: str
    ward: str
    room_bed: str
    chief_complaint: str
    attending_physician: str = "Dr. Eleanor Rivera, MD"

class RecordVitalsRequest(BaseModel):
    patient_id: str
    heart_rate: int
    systolic_bp: int
    diastolic_bp: int
    respiration_rate: int
    spo2: float
    temperature: float = 37.0
    o2_flow: str = "Room Air"
    consciousness: str = "Alert"

class RecordLabRequest(BaseModel):
    patient_id: str
    test_name: str
    value: str
    unit: str
    reference_range: str
    status: str

@router.get("/patients")
async def get_patient_list():
    """Retrieve list of inpatient/emergency patients with longitudinal risk and NEWS2 scores."""
    return doctor_copilot.list_all_patients()

@router.post("/patients/create")
async def create_new_patient(req: CreatePatientRequest):
    """Create a real new patient record in active hospital database."""
    return doctor_copilot.create_patient(
        full_name=req.full_name,
        age=req.age,
        gender=req.gender,
        dob=req.dob,
        blood_type=req.blood_type,
        ward=req.ward,
        room_bed=req.room_bed,
        chief_complaint=req.chief_complaint,
        attending_physician=req.attending_physician
    )

@router.get("/patients/{patient_id}")
async def get_patient_detail(patient_id: str):
    """Retrieve full longitudinal clinical profile, vitals time series, and timeline for a patient."""
    patient = doctor_copilot.get_patient_profile(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    return patient

@router.post("/vitals/record")
async def record_bedside_vitals(req: RecordVitalsRequest):
    """Record real physiological vitals at bedside with automatic NEWS2 deterioration calculation."""
    res = doctor_copilot.record_vitals(
        patient_id=req.patient_id,
        hr=req.heart_rate,
        sbp=req.systolic_bp,
        dbp=req.diastolic_bp,
        rr=req.respiration_rate,
        spo2=req.spo2,
        temp=req.temperature,
        o2_flow=req.o2_flow,
        avpu=req.consciousness
    )
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res

@router.post("/labs/record")
async def record_patient_lab(req: RecordLabRequest):
    """Record real laboratory test findings into patient medical record."""
    res = doctor_copilot.record_lab_result(
        patient_id=req.patient_id,
        test_name=req.test_name,
        value=req.value,
        unit=req.unit,
        reference_range=req.reference_range,
        status=req.status
    )
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res

@router.get("/patients/{patient_id}/telemetry/live")
async def get_patient_live_telemetry(patient_id: str):
    """Retrieve real-time physiological vitals stream, cardiac rhythm telemetry, and live NEWS2 deterioration alarms."""
    from backend.app.clinical.realtime_telemetry import realtime_telemetry
    return realtime_telemetry.get_live_patient_vitals(patient_id)

@router.post("/soap/draft")
async def draft_soap_note(req: SOAPDraftRequest):
    """Generate an AI-drafted SOAP note using Ollama Qwen LLM grounded in real vitals, lab trends, and guidelines."""
    draft = await doctor_copilot.generate_soap_note_draft(req.patient_id, req.physician_notes)
    if "error" in draft:
        raise HTTPException(status_code=404, detail=draft["error"])
    return draft

@router.post("/soap/verify")
async def verify_soap_note(req: SOAPVerifyRequest):
    """Physician review, modification, and official sign-off workflow (Human-in-the-Loop)."""
    res = doctor_copilot.save_signed_note(req.patient_id, req.physician_name, req.soap_content)
    return {
        "status": "CLINICIAN_VERIFIED_AND_SIGNED",
        "patient_id": req.patient_id,
        "physician_signature": f"Electronically signed by {req.physician_name}",
        "timestamp": res["note"]["signed_at"],
        "soap": req.soap_content,
        "audit_message": "Clinical SOAP note verified by attending physician and permanently saved to medical record."
    }

@router.get("/notes/{patient_id}")
async def get_patient_notes(patient_id: str):
    """Retrieve saved clinical SOAP notes for a patient."""
    notes = [n for n in doctor_copilot.SAVED_CLINICAL_NOTES if n["patient_id"] == patient_id]
    return notes
