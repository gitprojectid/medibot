import pytest
from backend.app.multimodal.radiology_engine import radiology_engine
from backend.app.voice.translation_engine import voice_engine
from backend.app.research.cohort_engine import cohort_engine
from backend.app.adaptive.feature_flags import adaptive_flags

def test_radiology_study_listing():
    studies = radiology_engine.list_studies()
    assert len(studies) >= 2
    assert any(s["modality"].startswith("CR") for s in studies)
    assert any(s["modality"].startswith("CT") for s in studies)

def test_radiology_report_verification():
    res = radiology_engine.verify_study_report(
        study_id="study-rad-001",
        radiologist_name="Dr. Rachel Green, MD"
    )
    assert res["status"] == "success"
    study = radiology_engine.get_study("study-rad-001")
    assert study["status"] == "RADIOLOGIST_FINAL_VERIFIED"
    assert study["radiologist_verification"]["verified_by"] == "Dr. Rachel Green, MD"

@pytest.mark.asyncio
async def test_voice_medical_translation_spanish():
    res = await voice_engine.translate_medical_text(
        text="Patient has severe chest pain and shortness of breath.",
        target_lang="es",
        source_lang="en"
    )
    assert res["target_lang"] == "es"
    assert "dolor en el pecho" in res["translated_text"]

@pytest.mark.asyncio
async def test_voice_safety_phrase_preservation():
    safety_text = "WARNING: These symptoms suggest a medical emergency. Please call 911 or visit the nearest Emergency Room immediately."
    res = await voice_engine.translate_medical_text(safety_text, "es", "en")
    assert "ADVERTENCIA" in res["translated_text"]
    assert res["is_safety_phrase"] is True

def test_clinical_research_cohort_query():
    res = cohort_engine.query_cohort(condition_keyword="Heart Failure", min_age=50)
    assert res["total_matches"] >= 1
    assert any("Heart Failure" in c["conditions"][0] for c in res["cohort"])

def test_clinical_trial_matching():
    matches = cohort_engine.match_patient_to_trials("pat-001")
    assert len(matches) >= 1
    assert "EMPA-KIDNEY-HF" in matches[0]["trial"]["title"]
    assert matches[0]["match_status"] == "ELIGIBLE"

def test_adaptive_feature_flags_toggle():
    status = adaptive_flags.get_status()
    assert "ENABLE_RADIOLOGY_AI" in status["flags"]
    assert status["flags"]["ENABLE_RADIOLOGY_AI"] is True
    
    # Toggle off then on
    res = adaptive_flags.update_flag("ENABLE_RADIOLOGY_AI", False)
    assert res["status"] == "success"
    assert adaptive_flags.flags["ENABLE_RADIOLOGY_AI"] is False
    
    adaptive_flags.update_flag("ENABLE_RADIOLOGY_AI", True)
    assert adaptive_flags.flags["ENABLE_RADIOLOGY_AI"] is True

def test_adaptive_environment_set():
    res = adaptive_flags.set_environment("PRODUCTION")
    assert res["status"] == "success"
    assert adaptive_flags.deployment_environment == "PRODUCTION"

    # Reset to CLINICAL-SANDBOX
    adaptive_flags.set_environment("CLINICAL-SANDBOX")
    assert adaptive_flags.deployment_environment == "CLINICAL-SANDBOX"
