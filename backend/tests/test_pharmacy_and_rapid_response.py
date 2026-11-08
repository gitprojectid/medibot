import pytest
from backend.app.clinical.pharmacy_engine import pharmacy_engine
from backend.app.clinical.rapid_response_engine import rapid_response_engine

def test_cockcroft_gault_crcl_calculation():
    # Male 70yo, 72kg, SCr 1.0 -> ((140-70)*72)/(72*1.0) = 70.0 mL/min
    res = pharmacy_engine.calculate_renal_function(
        age=70,
        weight_kg=72.0,
        gender="Male",
        serum_creatinine_mg_dl=1.0
    )
    assert res["cockcroft_gault_crcl_ml_min"] == 70.0
    assert "Stage 2" in res["ckd_stage"]

def test_renal_medication_dosing_audit():
    res = pharmacy_engine.audit_patient_medications_for_renal_risk("pat-001")
    assert "error" not in res
    assert "renal_profile" in res
    assert res["renal_profile"]["cockcroft_gault_crcl_ml_min"] > 0

def test_smart_iv_pump_titration_rate():
    # Norepinephrine 4mg/250mL (16 mcg/mL), 75kg, 0.08 mcg/kg/min -> (0.08 * 75 * 60)/16 = 22.5 mL/h
    res = pharmacy_engine.calculate_iv_infusion_pump_rate(
        drug_name="Norepinephrine",
        patient_weight_kg=75.0,
        desired_dose_mcg_kg_min=0.08,
        bag_amount_mg=4.0,
        bag_volume_ml=250.0
    )
    assert res["calculated_pump_rate_ml_hr"] == 22.5
    assert "mL/hr" in str(res["calculated_pump_rate_ml_hr"]) or res["calculated_pump_rate_ml_hr"] > 0

def test_rapid_response_team_activation_and_resolve():
    trig_res = rapid_response_engine.trigger_emergency_event(
        patient_id="pat-001",
        event_type="RAPID_RESPONSE_DETERIORATION",
        caller_name="Nurse Sarah, RN",
        trigger_reason="Acute drop in SpO2 to 86% on room air with tachypnea"
    )
    assert trig_res["status"] == "success"
    assert "CODE ALERT" in trig_res["broadcast_message"]
    
    event_id = trig_res["event"]["id"]
    events = rapid_response_engine.get_active_events()
    assert any(e["id"] == event_id for e in events)
    
    # Resolve
    res_res = rapid_response_engine.resolve_emergency_event(
        event_id=event_id,
        resolved_by="Dr. Eleanor Rivera, MD",
        outcome_status="STABILIZED_AT_BEDSIDE",
        outcome_notes="Applied non-rebreather mask, SpO2 96%, ABG within acceptable limits"
    )
    assert res_res["status"] == "success"
    assert res_res["event"]["status"] == "STABILIZED_AT_BEDSIDE"
