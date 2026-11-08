from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.app.clinical.discharge_engine import discharge_engine

router = APIRouter(prefix="/discharge", tags=["Hospital Discharge Documentation"])

class GenerateDischargeRequest(BaseModel):
    patient_id: str
    attending_physician: str
    discharge_disposition: str = "Home with Self Care"
    follow_up_days: int = 7

class SignDischargeRequest(BaseModel):
    discharge_id: str
    signed_by: str

@router.post("/generate")
async def generate_discharge_documentation(req: GenerateDischargeRequest):
    """Generate formal physician discharge summary and patient-friendly instructions in 1 click."""
    res = await discharge_engine.generate_discharge_package(
        patient_id=req.patient_id,
        attending_physician=req.attending_physician,
        discharge_disposition=req.discharge_disposition,
        follow_up_days=req.follow_up_days
    )
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res

@router.post("/finalize")
async def finalize_discharge_package(req: SignDischargeRequest):
    """Electronically sign and finalize discharge documentation."""
    return discharge_engine.sign_and_finalize_discharge(req.discharge_id, req.signed_by)
