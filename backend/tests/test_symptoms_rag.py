import pytest
from backend.app.medical.symptoms.symptom_engine import symptom_engine
from backend.app.rag.knowledge_base import knowledge_rag
from backend.app.medical.terminology.normalizer import terminology_normalizer

def test_symptom_heuristic_extraction():
    res = symptom_engine.heuristic_extract("I have abdominal pain with severity 7 out of 10 since yesterday.")
    assert len(res.symptoms) > 0
    assert res.chief_complaint == "abdominal pain"
    assert res.symptoms[0].severity == 7
    assert len(res.suggested_follow_up_questions) > 0

def test_rag_retrieval_and_citations():
    citations = knowledge_rag.get_citations("What are hypertension blood pressure thresholds?")
    assert len(citations) > 0
    assert any("Hypertension" in c.title for c in citations)
    assert any("American Heart Association" in c.authority for c in citations)

def test_multilingual_normalization():
    tamil_msg = "எனக்கு நெஞ்சு வலி மற்றும் மூச்சுத்திணறல் உள்ளது"
    normalized, lang, terms = terminology_normalizer.normalize(tamil_msg)
    assert lang == "ta"
    assert "chest pain" in terms
    assert "shortness of breath" in terms
