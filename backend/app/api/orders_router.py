from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from backend.app.clinical.orders_engine import orders_engine

router = APIRouter(prefix="/orders", tags=["Clinical Orders & CPOE Sets"])

class ExecuteBundleRequest(BaseModel):
    bundle_id: str
    patient_id: str
    ordering_physician: str

class CompleteOrderRequest(BaseModel):
    order_id: str
    completed_by: str

@router.get("/bundles")
async def get_clinical_order_bundles():
    """Retrieve pre-built guideline-directed clinical order sets (Sepsis, ACS, Heart Failure, COPD, Post-Op)."""
    return orders_engine.get_order_bundles()

@router.post("/execute-bundle")
async def execute_order_bundle(req: ExecuteBundleRequest):
    """Execute all orders in a guideline bundle in 1 click, dispatching tasks to nursing and eMAR."""
    res = orders_engine.execute_bundle_orders(
        bundle_id=req.bundle_id,
        patient_id=req.patient_id,
        ordering_physician=req.ordering_physician
    )
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res

@router.get("/patient/{patient_id}")
async def get_patient_active_orders(patient_id: str):
    """Retrieve active and completed clinical orders for a patient."""
    return orders_engine.get_orders_for_patient(patient_id)

@router.get("/all")
async def get_all_active_orders():
    """Retrieve all active hospital orders for nursing dashboard."""
    return orders_engine.get_all_active_orders()

@router.post("/complete")
async def complete_clinical_order(req: CompleteOrderRequest):
    """Mark an active clinical order as administered / completed by nursing."""
    res = orders_engine.complete_order(req.order_id, req.completed_by)
    if res.get("status") == "error":
        raise HTTPException(status_code=404, detail=res["message"])
    return res
