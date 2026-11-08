from typing import List, Dict, Any, Optional

class TriageEngine:
    """
    Standardized 5-tier clinical risk classification engine:
    - Level 0: Informational / Educational
    - Level 1: Low Concern / Self-Care
    - Level 2: Needs Medical Evaluation (Routine / Outpatient)
    - Level 3: Urgent Evaluation (Same day / Urgent care)
    - Level 4: Emergency (Immediate EMS / ER)
    """

    LEVEL_LABELS = {
        0: "Informational",
        1: "Low Concern",
        2: "Needs Medical Evaluation",
        3: "Urgent Evaluation",
        4: "Emergency"
    }

    URGENT_KEYWORDS = [
        "high fever", "fever over 103", "severe abdominal pain", "right lower quadrant",
        "stiff neck with fever", "persistent vomiting", "dehydration", "deep wound",
        "suspected fracture", "vision blurriness with headache", "worsening fast",
        "pain score 8", "pain score 9", "pain score 10", "severe pain"
    ]

    EVALUATION_KEYWORDS = [
        "pain for a week", "cough for 2 weeks", "chronic", "rash spreading",
        "unexplained weight loss", "fatigue for weeks", "joint swelling",
        "burning urination", "ear pain", "sinus pressure", "moderate pain",
        "blood pressure 150", "blood pressure 160"
    ]

    INFORMATIONAL_PATTERNS = [
        "what is", "how does", "define", "explain", "diet for", "exercises for",
        "information on", "normal range for", "vitamins for", "can you tell me about"
    ]

    def classify(
        self,
        text: str,
        is_emergency: bool = False,
        extracted_symptoms: Optional[List[Dict[str, Any]]] = None,
        patient_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        # 1. Emergency override
        if is_emergency:
            return {
                "triage_level": 4,
                "triage_label": self.LEVEL_LABELS[4],
                "recommended_action": "Seek immediate emergency medical care (Call 911 or visit Nearest Emergency Room).",
                "needs_escalation": True,
                "risk_score": 1.0
            }

        normalized = text.lower()

        # 2. Check maximum symptom severity if available
        max_severity = 0
        if extracted_symptoms:
            for s in extracted_symptoms:
                sev = s.get("severity")
                if isinstance(sev, int) and sev > max_severity:
                    max_severity = sev

        if max_severity >= 8:
            return {
                "triage_level": 3,
                "triage_label": self.LEVEL_LABELS[3],
                "recommended_action": "Urgent evaluation recommended within 12-24 hours.",
                "needs_escalation": True,
                "risk_score": 0.8
            }

        # 3. Check Urgent triggers
        for kw in self.URGENT_KEYWORDS:
            if kw in normalized:
                return {
                    "triage_level": 3,
                    "triage_label": self.LEVEL_LABELS[3],
                    "recommended_action": "Urgent clinic or same-day medical evaluation recommended.",
                    "needs_escalation": True,
                    "risk_score": 0.75
                }

        # 4. Check Medical Evaluation triggers
        for kw in self.EVALUATION_KEYWORDS:
            if kw in normalized:
                return {
                    "triage_level": 2,
                    "triage_label": self.LEVEL_LABELS[2],
                    "recommended_action": "Consult a healthcare professional or primary care physician for evaluation.",
                    "needs_escalation": False,
                    "risk_score": 0.5
                }

        if extracted_symptoms and len(extracted_symptoms) > 0:
            # Active symptoms without red flags -> Level 2 or 1
            if max_severity >= 5:
                return {
                    "triage_level": 2,
                    "triage_label": self.LEVEL_LABELS[2],
                    "recommended_action": "Medical evaluation recommended if symptoms persist or worsen.",
                    "needs_escalation": False,
                    "risk_score": 0.45
                }
            return {
                "triage_level": 1,
                "triage_label": self.LEVEL_LABELS[1],
                "recommended_action": "Monitor symptoms and practice supportive self-care. Seek care if symptoms worsen.",
                "needs_escalation": False,
                "risk_score": 0.2
            }

        # 5. Check Informational
        for pattern in self.INFORMATIONAL_PATTERNS:
            if pattern in normalized:
                return {
                    "triage_level": 0,
                    "triage_label": self.LEVEL_LABELS[0],
                    "recommended_action": "Educational health information.",
                    "needs_escalation": False,
                    "risk_score": 0.0
                }

        # Default fallback
        return {
            "triage_level": 1,
            "triage_label": self.LEVEL_LABELS[1],
            "recommended_action": "Consult a healthcare professional for personalized guidance.",
            "needs_escalation": False,
            "risk_score": 0.2
        }

triage_engine = TriageEngine()
