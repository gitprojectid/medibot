from fastapi import APIRouter, HTTPException
from backend.app.clinical.billing_engine import billing_engine

router = APIRouter(prefix="/billing", tags=["Automated Clinical Coding & Billing Engine"])

@router.get("/summary/{patient_id}")
async def get_patient_billing_summary(patient_id: str):
    """Generate automated ICD-10 diagnosis codes, CPT procedural codes, DRG classification, and CDI opportunities."""
    res = await billing_engine.generate_coding_and_billing_summary(patient_id)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res
