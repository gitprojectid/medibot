from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from backend.app.research.cohort_engine import cohort_engine

router = APIRouter(prefix="/research", tags=["Clinical Research & Cohort Discovery"])

class CohortQueryRequest(BaseModel):
    condition_keyword: Optional[str] = None
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    medication_keyword: Optional[str] = None

@router.get("/trials")
async def list_active_clinical_trials():
    """Retrieve active clinical trials, sponsors, and inclusion/exclusion criteria."""
    return cohort_engine.ACTIVE_CLINICAL_TRIALS

@router.post("/cohort-query")
async def query_patient_cohort(req: CohortQueryRequest):
    """Execute multi-parameter cohort search across synthetic patient database."""
    return cohort_engine.query_cohort(
        condition_keyword=req.condition_keyword,
        min_age=req.min_age,
        max_age=req.max_age,
        medication_keyword=req.medication_keyword
    )

@router.get("/match/{patient_id}")
async def match_patient_trials(patient_id: str):
    """Screen an individual patient for active clinical trial eligibility."""
    return cohort_engine.match_patient_to_trials(patient_id)
