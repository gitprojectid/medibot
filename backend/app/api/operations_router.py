from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.app.operations.operations_engine import operations_engine

router = APIRouter(prefix="/operations", tags=["Hospital Operations & Command Center"])

class BedActionRequest(BaseModel):
    department_id: str

@router.get("/dashboard")
async def get_hospital_operations():
    """Retrieve real-time hospital census, multi-horizon bed forecasting (6h/24h/7d), ED flow, and blood bank status."""
    return operations_engine.get_operations_dashboard()

@router.get("/activity-stream")
async def get_realtime_activity_stream():
    """Retrieve real-time hospital operations activity feed and alert logs."""
    from backend.app.clinical.realtime_telemetry import realtime_telemetry
    return realtime_telemetry.get_live_hospital_activity_stream()

@router.post("/admit")
async def admit_patient_bed(req: BedActionRequest):
    """Allocate a bed and increment occupancy for a specific hospital ward."""
    res = operations_engine.admit_patient_to_dept(req.department_id)
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res["message"])
    return res

@router.post("/discharge")
async def discharge_patient_bed(req: BedActionRequest):
    """Release a bed upon patient discharge and recalculate hospital census."""
    res = operations_engine.discharge_patient_from_dept(req.department_id)
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res["message"])
    return res
