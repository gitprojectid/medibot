import pytest
from backend.app.clinical.monitoring_engine import monitoring_engine
from backend.app.clinical.doctor_copilot import doctor_copilot
from backend.app.clinical.nurse_copilot import nurse_copilot
from backend.app.operations.operations_engine import operations_engine
from backend.app.documents.document_ai import document_ai
from backend.app.interop.fhir_engine import fhir_engine
from backend.app.governance.governance_engine import governance_engine

def test_news2_scoring_high_risk():
    res = monitoring_engine.calculate_news2(
        rr=26,
        spo2=91,
        is_on_supplemental_o2=True,
        sbp=86,
        hr=112,
        consciousness="Voice",
        temp=39.1
    )
    assert res["total_score"] >= 7
    assert res["risk_tier"] == "HIGH"
    assert "EMERGENCY" in res["clinical_response"]

def test_news2_scoring_stable():
    res = monitoring_engine.calculate_news2(
        rr=16,
        spo2=98,
        is_on_supplemental_o2=False,
        sbp=120,
        hr=72,
        consciousness="Alert",
        temp=37.0
    )
    assert res["total_score"] == 0
    assert res["risk_tier"] == "NORMAL"

def test_qsofa_sepsis_detection():
    res = monitoring_engine.calculate_qsofa(
        sbp=90,
        rr=24,
        altered_mental_status=True
    )
    assert res["qsofa_score"] == 3
    assert res["is_high_risk_sepsis"] is True
    assert "SEPSIS ALERT" in res["recommendation"]

@pytest.mark.asyncio
async def test_doctor_copilot_soap_draft():
    draft = await doctor_copilot.generate_soap_note_draft("pat-001")
    assert "error" not in draft
    assert "soap" in draft
    assert "subjective" in draft["soap"]
    assert "assessment" in draft["soap"]
    assert "plan" in draft["soap"]
    assert "NEWS2" in draft["soap"]["objective"]
    assert draft["status"] == "AI_GENERATED_DRAFT"

def test_nurse_copilot_shift_handoff():
    handoff = nurse_copilot.generate_ward_shift_handoff()
    assert handoff["total_assigned_patients"] > 0
    assert "patients" in handoff
    assert all("sbar" in p for p in handoff["patients"])
    assert all("med_schedule" in p for p in handoff["patients"])

def test_document_ai_negation_and_entities():
    sample_text = """
    Patient with Essential Hypertension. Denies history of stroke. 
    No evidence of diabetes. Lisinopril 20 mg oral daily.
    """
    res = document_ai.extract_entities_from_text(sample_text)
    assert len(res["negations"]) > 0
    # Stroke & Diabetes should be flagged as negated or not active
    stroke_cond = next((c for c in res["conditions"] if "Stroke" in c["name"]), None)
    if stroke_cond:
        assert stroke_cond["is_negated"] is True
    assert any(m["name"] == "Lisinopril" for m in res["medications"])

def test_fhir_r4_bundle_generation():
    bundle = fhir_engine.generate_patient_fhir_bundle("pat-001")
    assert bundle["resourceType"] == "Bundle"
    assert bundle["type"] == "collection"
    assert len(bundle["entry"]) >= 3
    resource_types = [e["resource"]["resourceType"] for e in bundle["entry"]]
    assert "Patient" in resource_types
    assert "Condition" in resource_types

def test_hl7_v2_adt_generation():
    hl7_msg = fhir_engine.generate_hl7_v2_adt_message("pat-001")
    assert "MSH|^~\\&" in hl7_msg
    assert "ADT^A01" in hl7_msg
    assert "PID|" in hl7_msg

def test_operations_bed_forecasting():
    dash = operations_engine.get_operations_dashboard()
    assert "summary" in dash
    assert "bed_forecast" in dash
    assert "horizon_6h" in dash["bed_forecast"]
    assert "horizon_24h" in dash["bed_forecast"]
    assert "horizon_7d" in dash["bed_forecast"]
    assert len(dash["blood_bank"]["inventory"]) > 0

def test_governance_adversarial_suite():
    gov = governance_engine.get_governance_report()
    assert len(gov["model_cards"]) >= 2
    assert gov["adversarial_benchmark"]["pass_rate_pct"] == 100.0
    assert gov["failsafe_mode"]["emergency_deterministic_fallback"] is not None
