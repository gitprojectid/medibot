import re
from typing import Dict, Any, List, Tuple

class ResponseSafetyValidator:
    """
    Validates model-generated responses before they reach the user.
    Enforces non-diagnostic phrasing, dosage safety, uncertainty disclosure,
    and anti-hallucination guardrails.
    """

    DEFINITIVE_DIAGNOSIS_PATTERNS = [
        r"\byou\s+(have|suffer\s+from|are\s+diagnosed\s+with)\s+([a-z\s]*\b(disease|disorder|syndrome|infection|pneumonia|appendicitis|cancer|stroke|migraine|diabetes|hypertension)\b)",
        r"\bi\s+diagnose\s+you\s+with\b",
        r"\bthis\s+is\s+definitely\b",
        r"\byou\s+definitely\s+have\b"
    ]

    DANGEROUS_PRESCRIPTION_PATTERNS = [
        r"\bi\s+prescribe\b",
        r"\btake\s+\d+\s*(mg|milligrams|g|ml)\s+of\s+[a-z\s]+\s+(daily|every\s+\d+\s*hours|three\s+times\s+a\s+day)\b",
        r"\bstop\s+taking\s+your\s+prescribed\b"
    ]

    FALSE_REASSURANCE_PATTERNS = [
        r"\byou\s+have\s+nothing\s+to\s+worry\s+about\b",
        r"\bthere\s+is\s+no\s+need\s+to\s+see\s+a\s+doctor\b",
        r"\bthis\s+is\s+100%\s+harmless\b",
        r"\bcompletely\s+harmless\b"
    ]

    def validate(self, response_text: str, is_emergency: bool = False) -> Tuple[bool, str, List[str]]:
        """
        Returns (is_valid, sanitized_response, list_of_violations).
        """
        violations = []
        sanitized = response_text

        # 1. Emergency check - if emergency flag is on, ensure response contains emergency disclaimer
        if is_emergency:
            if not any(k in response_text.lower() for k in ["emergency", "911", "immediate", "urgent"]):
                sanitized = "⚠️ **EMERGENCY WARNING**: Based on your reported symptoms, you may require immediate emergency medical attention. Please call emergency services (911/988) or go to the nearest emergency room immediately.\n\n" + sanitized
                violations.append("emergency_disclaimer_missing")

        # 2. Check definitive diagnosis patterns
        for pattern in self.DEFINITIVE_DIAGNOSIS_PATTERNS:
            if re.search(pattern, response_text, re.IGNORECASE):
                violations.append("definitive_diagnosis_detected")
                # Replace definitive claims with differential phrasing
                sanitized = re.sub(
                    r"\byou\s+have\s+",
                    "You may be experiencing symptoms consistent with ",
                    sanitized,
                    flags=re.IGNORECASE
                )
                sanitized = re.sub(
                    r"\byou\s+definitely\s+have\s+",
                    "A possible consideration might be ",
                    sanitized,
                    flags=re.IGNORECASE
                )

        # 3. Check unauthorized prescription / dosage patterns
        for pattern in self.DANGEROUS_PRESCRIPTION_PATTERNS:
            if re.search(pattern, response_text, re.IGNORECASE):
                violations.append("unauthorized_prescription_detected")
                sanitized = (
                    "**Safety Note**: Medication dosages and prescription recommendations require direct clinician or pharmacist authorization.\n\n"
                    + sanitized
                )

        # 4. Check false reassurance
        for pattern in self.FALSE_REASSURANCE_PATTERNS:
            if re.search(pattern, response_text, re.IGNORECASE):
                violations.append("false_reassurance_detected")
                sanitized = re.sub(
                    pattern,
                    "While this may often be manageable, please monitor for any persistent or worsening signs.",
                    sanitized,
                    flags=re.IGNORECASE
                )

        # 5. Append standard medical disclaimer if missing
        if "substitute for professional medical advice" not in sanitized.lower() and not is_emergency:
            sanitized += "\n\n*Note: This information is for educational purposes and does not substitute for professional clinical judgment.*"

        is_valid = len(violations) == 0
        return is_valid, sanitized, violations

    def get_safe_fallback(self, reason: str = "Safety validation fallback") -> str:
        return (
            "I am unable to provide a specific clinical answer safely based on the available information. "
            "Please consult a qualified healthcare professional or your primary care physician for a personalized evaluation."
        )

response_safety_validator = ResponseSafetyValidator()
