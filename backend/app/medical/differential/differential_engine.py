from typing import List, Dict, Any, Optional
from backend.app.ai.schemas.chat_schemas import ExtractedSymptom, DifferentialCandidate

class DifferentialEngine:
    """
    Evidence-based clinical differential consideration engine.
    Analyzes symptom clusters, temporal onset, and aggravating factors
    to formulate structured non-definitive differential possibilities.
    """

    KNOWLEDGE_PATTERNS = [
        {
            "condition": "Acute Coronary Syndrome / Myocardial Infarction",
            "required_symptoms": ["chest pain", "chest pressure"],
            "supporting_keywords": ["pressure", "sweating", "left arm", "shortness of breath", "crushing", "exertion", "substernal", "diaphoresis"],
            "urgency": "emergency"
        },
        {
            "condition": "Gastroesophageal Reflux Disease (GERD) / Esophagitis",
            "required_symptoms": ["chest pain", "abdominal pain", "heartburn"],
            "supporting_keywords": ["burning", "after eating", "lying down", "acid", "antacid relieves", "sour taste", "regurgitation"],
            "urgency": "routine"
        },
        {
            "condition": "Costochondritis / Musculoskeletal Chest Wall Strain",
            "required_symptoms": ["chest pain"],
            "supporting_keywords": ["tender to touch", "reproducible on palpation", "sharp", "worse with movement", "deep breath"],
            "urgency": "routine"
        },
        {
            "condition": "Acute Appendicitis",
            "required_symptoms": ["abdominal pain"],
            "supporting_keywords": ["right lower quadrant", "periumbilical migration", "fever", "nausea", "vomiting", "loss of appetite", "rebound tenderness"],
            "urgency": "urgent"
        },
        {
            "condition": "Nephrolithiasis (Renal Calculi / Kidney Stone)",
            "required_symptoms": ["back pain", "abdominal pain", "flank pain"],
            "supporting_keywords": ["severe colicky flank pain", "radiating to groin", "blood in urine", "hematuria", "dysuria", "nausea"],
            "urgency": "urgent"
        },
        {
            "condition": "Acute Gastroenteritis / Viral Enteritis",
            "required_symptoms": ["abdominal pain", "diarrhea", "nausea"],
            "supporting_keywords": ["watery diarrhea", "cramping", "low fever", "vomiting", "recent food consumption"],
            "urgency": "routine"
        },
        {
            "condition": "Community-Acquired Pneumonia",
            "required_symptoms": ["cough", "fever", "shortness of breath"],
            "supporting_keywords": ["productive phlegm", "green or rust sputum", "shaking chills", "pleuritic chest pain", "crackles"],
            "urgency": "urgent"
        },
        {
            "condition": "Acute Bronchial Asthma Exacerbation",
            "required_symptoms": ["shortness of breath", "cough", "wheezing"],
            "supporting_keywords": ["wheezing", "chest tightness", "cold air trigger", "allergen exposure", "worse at night"],
            "urgency": "urgent"
        },
        {
            "condition": "Migraine with/without Aura",
            "required_symptoms": ["headache"],
            "supporting_keywords": ["throbbing", "unilateral", "photophobia", "light sensitivity", "sound sensitivity", "nausea", "visual aura"],
            "urgency": "routine"
        },
        {
            "condition": "Acute Bacterial Sinusitis",
            "required_symptoms": ["headache", "facial pain", "nasal congestion"],
            "supporting_keywords": ["facial pressure", "purulent nasal discharge", "pain leaning forward", "maxillary tenderness"],
            "urgency": "routine"
        },
        {
            "condition": "Streptococcal Pharyngitis (Strep Throat)",
            "required_symptoms": ["sore throat", "fever"],
            "supporting_keywords": ["tonsillar exudates", "tender anterior cervical lymphadenopathy", "absence of cough", "pain swallowing"],
            "urgency": "routine"
        },
        {
            "condition": "Lumbar Radiculopathy / Sciatica",
            "required_symptoms": ["back pain"],
            "supporting_keywords": ["shooting down leg", "numbness in foot", "worse sitting", "positive straight leg raise"],
            "urgency": "routine"
        }
    ]

    def evaluate_differential(
        self,
        extracted_symptoms: List[ExtractedSymptom],
        text: str
    ) -> List[DifferentialCandidate]:
        candidates: List[DifferentialCandidate] = []
        normalized_text = text.lower()
        symptom_names = [s.name.lower() for s in extracted_symptoms]

        for entry in self.KNOWLEDGE_PATTERNS:
            has_required = any(req in symptom_names for req in entry["required_symptoms"]) or \
                           any(req in normalized_text for req in entry["required_symptoms"])
            
            if has_required:
                supporting = []
                missing = []
                
                for kw in entry["supporting_keywords"]:
                    if kw in normalized_text or any(kw in s for s in symptom_names):
                        supporting.append(kw)
                    else:
                        missing.append(kw)

                candidates.append(
                    DifferentialCandidate(
                        name=entry["condition"],
                        supporting_features=supporting[:4],
                        missing_features=missing[:3],
                        contradicting_features=[],
                        urgency=entry["urgency"]
                    )
                )

        return candidates[:4]

# Singleton instance
differential_engine = DifferentialEngine()
