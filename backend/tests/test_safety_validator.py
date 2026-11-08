import pytest
from backend.app.safety.validators.response_validator import response_safety_validator

def test_definitive_diagnosis_blocking():
    unsafe_text = "Based on your symptoms, you have pneumonia and should be worried."
    is_valid, sanitized, violations = response_safety_validator.validate(unsafe_text)
    assert is_valid is False
    assert "definitive_diagnosis_detected" in violations
    assert "You may be experiencing symptoms consistent with pneumonia" in sanitized

def test_false_reassurance_blocking():
    unsafe_text = "You have nothing to worry about, this is 100% harmless."
    is_valid, sanitized, violations = response_safety_validator.validate(unsafe_text)
    assert is_valid is False
    assert "false_reassurance_detected" in violations

def test_emergency_disclaimer_enforcement():
    resp_text = "Please relax and rest in bed."
    is_valid, sanitized, violations = response_safety_validator.validate(resp_text, is_emergency=True)
    assert "EMERGENCY WARNING" in sanitized
