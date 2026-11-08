from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.app.clinical.pharmacy_engine import pharmacy_engine

router = APIRouter(prefix="/pharmacy", tags=["Clinical Pharmacy & Renal Dosing Engine"])

class RenalCalcRequest(BaseModel):
    age: int
    weight_kg: float
    gender: str
    serum_creatinine_mg_dl: float

class IVInfusionRequest(BaseModel):
    drug_name: str
    patient_weight_kg: float
    desired_dose_mcg_kg_min: float
    bag_amount_mg: float
    bag_volume_ml: float

@router.post("/renal-calculator")
async def calculate_patient_renal_function(req: RenalCalcRequest):
    """Calculate Cockcroft-Gault CrCl and CKD stage classification."""
    return pharmacy_engine.calculate_renal_function(
        age=req.age,
        weight_kg=req.weight_kg,
        gender=req.gender,
        serum_creatinine_mg_dl=req.serum_creatinine_mg_dl
    )

@router.get("/patient/{patient_id}/renal-audit")
async def audit_patient_renal_dosing(patient_id: str):
    """Audit all active medications for an inpatient against real renal function parameters."""
    res = pharmacy_engine.audit_patient_medications_for_renal_risk(patient_id)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res

@router.post("/iv-infusion-calculator")
async def calculate_smart_iv_pump_rate(req: IVInfusionRequest):
    """Calculate exact smart pump infusion rate in mL/hour for weight-based critical drips."""
    return pharmacy_engine.calculate_iv_infusion_pump_rate(
        drug_name=req.drug_name,
        patient_weight_kg=req.patient_weight_kg,
        desired_dose_mcg_kg_min=req.desired_dose_mcg_kg_min,
        bag_amount_mg=req.bag_amount_mg,
        bag_volume_ml=req.bag_volume_ml
    )
