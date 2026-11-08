from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from backend.app.multimodal.radiology_engine import radiology_engine

router = APIRouter(prefix="/multimodal", tags=["Multimodal Radiology & Imaging Intelligence"])

class RadiologistVerifyRequest(BaseModel):
    study_id: str
    radiologist_name: str
    modified_impression: Optional[str] = None

@router.get("/studies")
async def list_imaging_studies():
    """Retrieve list of DICOM imaging studies (X-ray, CT, MRI)."""
    return radiology_engine.list_studies()

@router.get("/studies/{study_id}")
async def get_study_detail(study_id: str):
    """Retrieve simulated DICOM slices, AI bounding box findings, and preliminary impression."""
    study = radiology_engine.get_study(study_id)
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
    return study

@router.post("/radiology/verify")
async def verify_radiology_report(req: RadiologistVerifyRequest):
    """Radiologist human-in-the-loop overread and electronic sign-off workflow."""
    res = radiology_engine.verify_study_report(req.study_id, req.radiologist_name, req.modified_impression)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res
