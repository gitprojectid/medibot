import pytest
from backend.app.clinical.billing_engine import billing_engine
from backend.app.clinical.orders_engine import orders_engine
from backend.app.clinical.discharge_engine import discharge_engine
from backend.app.clinical.alerts_engine import alerts_engine

@pytest.mark.asyncio
async def test_billing_engine_icd10_and_drg():
    res = await billing_engine.generate_coding_and_billing_summary("pat-001")
    assert "error" not in res
    assert len(res["icd10_diagnoses"]) >= 1
    assert any("I50" in code["code"] for code in res["icd10_diagnoses"])
    assert res["drg_classification"]["ms_drg"] == "DRG-291"
    assert "Heart Failure" in res["drg_classification"]["title"]
    assert len(res["cpt_procedures"]) >= 1

def test_orders_engine_bundle_execution():
    res = orders_engine.execute_bundle_orders(
        bundle_id="bundle-sepsis-01",
        patient_id="pat-001",
        ordering_physician="Dr. Eleanor Rivera, MD"
    )
    assert res["status"] == "success"
    assert res["orders_count"] == 6
    
    # Check patient orders queue
    orders = orders_engine.get_orders_for_patient("pat-001")
    assert len(orders) >= 6
    
    # Complete an order
    order_id = orders[0]["id"]
    comp_res = orders_engine.complete_order(order_id, completed_by="Nurse Sarah, RN")
    assert comp_res["status"] == "success"
    assert comp_res["order"]["status"] == "COMPLETED"

@pytest.mark.asyncio
async def test_discharge_engine_package_generation():
    pkg = await discharge_engine.generate_discharge_package(
        patient_id="pat-001",
        attending_physician="Dr. Robert Chen, MD",
        discharge_disposition="Home with Self Care",
        follow_up_days=7
    )
    assert "error" not in pkg
    assert "formal_summary" in pkg
    assert "patient_instructions" in pkg
    assert "RED FLAG" in pkg["patient_instructions"] or "EMERGENCY" in pkg["patient_instructions"]
    
    # Finalize
    fin_res = discharge_engine.sign_and_finalize_discharge(pkg["id"], signed_by="Dr. Robert Chen, MD")
    assert fin_res["status"] == "DISCHARGE_FINALIZED_AND_LOCKED"

def test_alerts_engine_active_alerts_and_ack():
    alerts = alerts_engine.get_active_hospital_alerts()
    assert len(alerts) >= 1
    
    first_alert = alerts[0]
    alert_id = first_alert["id"]
    
    ack_res = alerts_engine.acknowledge_alert(
        alert_id=alert_id,
        clinician_name="Dr. Attending, MD",
        action_taken="Bedside evaluation complete"
    )
    assert ack_res["status"] == "success"
    assert ack_res["acknowledgement"]["acknowledged_by"] == "Dr. Attending, MD"
