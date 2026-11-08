from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from backend.app.database.backup_engine import backup_engine

router = APIRouter(prefix="/system", tags=["System Deployment, Readiness & Backup Engine"])

class ImportBackupRequest(BaseModel):
    backup_data: Dict[str, Any]

@router.get("/diagnostics")
async def get_system_diagnostics():
    """Retrieve real-time deployment metrics, database size, table record counts, and Ollama latency."""
    return await backup_engine.get_system_diagnostics()

@router.get("/backup/export")
async def export_hospital_database():
    """Generate and export a complete JSON snapshot of all hospital records, patients, orders, and clinical notes."""
    return await backup_engine.export_database_backup()

@router.post("/backup/import")
async def import_hospital_database(req: ImportBackupRequest):
    """Import and restore database state from a verified JSON backup package."""
    return await backup_engine.import_database_backup(req.backup_data)
