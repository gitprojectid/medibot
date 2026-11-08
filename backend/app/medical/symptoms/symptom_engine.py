import re
from typing import Dict, Any, List, Optional
from backend.app.ai.schemas.chat_schemas import ExtractedSymptom, SymptomExtractionResult
from backend.app.ai.providers.ollama_provider import ollama_provider
from backend.app.ai.prompts.system_prompts import SYMPTOM_EXTRACTION_PROMPT

class SymptomEngine:
    """
    Extracts structured clinical symptoms from user conversation, identifies
    missing details (onset, duration, severity, location), and generates targeted questions.
    """

    COMMON_SYMPTOMS = {
        "chest pain": ["central chest", "left chest", "substernal"],
        "abdominal pain": ["right lower quadrant", "epigastric", "lower abdomen", "upper abdomen"],
        "headache": ["frontal", "temporal", "occipital", "one side", "whole head"],
        "fever": ["high grade", "low grade", "chills"],
        "cough": ["dry", "productive", "barking"],
        "shortness of breath": ["at rest", "on exertion", "lying down"],
        "back pain": ["lower back", "upper back", "radiating"],
        "sore throat": ["difficulty swallowing", "scratchy"],
        "dizziness": ["lightheadedness", "room spinning / vertigo"],
        "nausea": ["with vomiting", "without vomiting"],
        "fatigue": ["extreme", "chronic", "mild"],
        "joint pain": ["knees", "wrists", "fingers", "shoulders"],
        "skin rash": ["itching", "redness", "blisters", "spreading"]
    }

    def heuristic_extract(self, text: str) -> SymptomExtractionResult:
        """Fast fallback rule-based symptom extraction."""
        normalized = text.lower()
        extracted: List[ExtractedSymptom] = []
        missing_info: List[str] = []
        follow_ups: List[str] = []

        # Find symptoms
        for symptom_name in self.COMMON_SYMPTOMS.keys():
            if symptom_name in normalized:
                # Extract severity if mentioned
                sev_match = re.search(r"\b([1-9]|10)\s*(out of 10|\/10|severity)?\b", normalized)
                severity = int(sev_match.group(1)) if sev_match and int(sev_match.group(1)) <= 10 else None

                # Extract onset / duration keywords
                onset = None
                if "yesterday" in normalized:
                    onset = "yesterday"
                elif "today" in normalized:
                    onset = "today"
                elif "days ago" in normalized or "day ago" in normalized:
                    onset = "a few days ago"
                elif "hours ago" in normalized:
                    onset = "a few hours ago"

                # Quality keywords
                quality = None
                for q in ["sharp", "dull", "throbbing", "burning", "aching", "cramping", "stabbing"]:
                    if q in normalized:
                        quality = q
                        break

                s = ExtractedSymptom(
                    name=symptom_name,
                    severity=severity,
                    onset=onset,
                    quality=quality,
                    location=None,
                    associated_symptoms=[]
                )
                extracted.append(s)

        if extracted:
            chief = extracted[0].name
            if not extracted[0].severity:
                missing_info.append("severity rating (1-10)")
                follow_ups.append(f"On a scale of 1 to 10, how severe is your {chief}?")
            if not extracted[0].onset:
                missing_info.append("onset/duration")
                follow_ups.append(f"When did the {chief} first begin, and has it been constant or coming and going?")
            if not extracted[0].location and chief in ["abdominal pain", "chest pain", "back pain"]:
                missing_info.append("exact location")
                follow_ups.append(f"Where exactly is the {chief} located?")
            
            return SymptomExtractionResult(
                chief_complaint=chief,
                symptoms=extracted,
                missing_critical_info=missing_info,
                suggested_follow_up_questions=follow_ups[:3]
            )

        return SymptomExtractionResult(
            chief_complaint=None,
            symptoms=[],
            missing_critical_info=[],
            suggested_follow_up_questions=[]
        )

    async def extract_symptoms(self, text: str) -> SymptomExtractionResult:
        """
        Extract symptoms using fast heuristic first, enriched by Ollama LLM if available.
        """
        base_result = self.heuristic_extract(text)
        
        # If heuristics found symptoms or message is short, return structured result
        if base_result.symptoms:
            return base_result

        # Otherwise query Ollama for complex/uncommon symptom descriptions
        try:
            llm_result = await ollama_provider.extract_structured(
                prompt=f"Extract symptoms from this user message: '{text}'",
                system_prompt=SYMPTOM_EXTRACTION_PROMPT,
                schema=SymptomExtractionResult
            )
            if llm_result and isinstance(llm_result, SymptomExtractionResult) and llm_result.symptoms:
                return llm_result
        except Exception:
            pass

        return base_result

symptom_engine = SymptomEngine()
