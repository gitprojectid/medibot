from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any
from backend.app.adaptive.feature_flags import adaptive_flags

router = APIRouter(prefix="/adaptive", tags=["Adaptive Feature Flags & Sandbox Configuration"])

class FlagToggleRequest(BaseModel):
    flag_name: str
    enabled: bool

class EnvironmentSetRequest(BaseModel):
    environment_name: str

@router.get("/config")
async def get_adaptive_configuration():
    """Retrieve current feature flags and deployment environment."""
    return adaptive_flags.get_status()

@router.post("/flags/toggle")
async def toggle_feature_flag(req: FlagToggleRequest):
    """Dynamically toggle an adaptive AI capability flag on or off."""
    return adaptive_flags.update_flag(req.flag_name, req.enabled)

@router.post("/environment/set")
async def set_deployment_environment(req: EnvironmentSetRequest):
    """Switch deployment environment tier (DEVELOPMENT, CLINICAL-SANDBOX, PILOT, PRODUCTION)."""
    return adaptive_flags.set_environment(req.environment_name)
