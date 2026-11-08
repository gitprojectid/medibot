import pytest
from backend.app.medical.medications.medication_engine import medication_engine

def test_drug_drug_interaction():
    res = medication_engine.check_safety(
        current_medications=["warfarin"],
        new_medication_or_query="Can I take aspirin with my daily pill?"
    )
    assert res["has_alerts"] is True
    assert res["has_major_conflict"] is True
    assert any("bleeding risk" in a["message"].lower() for a in res["alerts"])

def test_allergy_cross_reactivity():
    res = medication_engine.check_safety(
        current_medications=[],
        new_medication_or_query="Can I take amoxicillin for tooth pain?",
        patient_allergies=["penicillin"]
    )
    assert res["has_alerts"] is True
    assert res["has_major_conflict"] is True
    assert any(a["type"] == "ALLERGY_CROSS_REACTIVITY" for a in res["alerts"])

def test_condition_contraindication():
    res = medication_engine.check_safety(
        current_medications=[],
        new_medication_or_query="Taking propranolol for stage fright",
        patient_conditions=["Severe Asthma"]
    )
    assert res["has_alerts"] is True
    assert any(a["type"] == "CONTRAINDICATION" for a in res["alerts"])

def test_pregnancy_contraindication():
    res = medication_engine.check_safety(
        current_medications=[],
        new_medication_or_query="Can I take lisinopril?",
        is_pregnant=True
    )
    assert res["has_alerts"] is True
    assert any(a["type"] == "PREGNANCY_CONTRAINDICATION" for a in res["alerts"])
