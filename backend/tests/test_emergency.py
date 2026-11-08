import pytest
from backend.app.safety.emergency.emergency_engine import emergency_engine

def test_cardiovascular_emergency():
    res = emergency_engine.evaluate("I have severe crushing chest pain radiating to my left arm with cold sweat.")
    assert res is not None
    assert res["is_emergency"] is True
    assert "Cardiovascular" in res["category"]
    assert res["triage_level"] == 4

def test_stroke_emergency():
    res = emergency_engine.evaluate("My mother has sudden facial drooping and slurred speech.")
    assert res is not None
    assert res["is_emergency"] is True
    assert "Stroke" in res["category"]
    assert res["triage_level"] == 4

def test_respiratory_emergency():
    res = emergency_engine.evaluate("I cannot breathe and my lips are turning blue.")
    assert res is not None
    assert res["is_emergency"] is True
    assert "Respiratory" in res["category"]
    assert res["triage_level"] == 4

def test_anaphylaxis_emergency():
    res = emergency_engine.evaluate("My throat is swelling up and closing after eating peanuts.")
    assert res is not None
    assert res["is_emergency"] is True
    assert "Anaphylaxis" in res["category"]
    assert res["triage_level"] == 4

def test_mental_health_crisis():
    res = emergency_engine.evaluate("I have severe suicidal thoughts and want to end my life.")
    assert res is not None
    assert res["is_emergency"] is True
    assert res["phone"] == "988"

def test_non_emergency():
    res = emergency_engine.evaluate("I have a mild runny nose and sneezing since this morning.")
    assert res is None
