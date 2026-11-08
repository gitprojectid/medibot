import pytest
from backend.app.database.backup_engine import backup_engine

@pytest.mark.asyncio
async def test_system_diagnostics_health():
    diag = await backup_engine.get_system_diagnostics()
    assert diag["status"] == "HEALTHY_READY_FOR_DEPLOYMENT"
    assert "ONLINE" in diag["uptime_status"]
    assert "database" in diag
    assert diag["database"]["table_record_counts"]["inpatient_active_records"] >= 1
    assert "ollama_ai" in diag
    assert diag["ollama_ai"]["ping_latency_ms"] >= 0

@pytest.mark.asyncio
async def test_database_backup_export_and_import():
    # 1. Export
    backup = await backup_engine.export_database_backup()
    assert "metadata" in backup
    assert "clinical_state" in backup
    assert len(backup["clinical_state"]["patients"]) >= 1
    
    # 2. Import / Restore
    restore_res = await backup_engine.import_database_backup(backup)
    assert restore_res["status"] == "success"
    assert restore_res["restored_counts"]["patients"] >= 1
