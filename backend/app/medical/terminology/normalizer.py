from typing import Dict, Tuple, List, Optional

class MedicalTerminologyNormalizer:
    """
    Multilingual medical terminology normalizer.
    Maps terms across English, Tamil, Hindi, Telugu, Malayalam, and Kannada
    to standard clinical concepts.
    """

    TERM_MAP = {
        # Tamil
        "நெஞ்சு வலி": "chest pain",
        "மாரடைப்பு": "heart attack",
        "மூச்சுத்திணறல்": "shortness of breath",
        "காய்ச்சல்": "fever",
        "தலைவலி": "headache",
        "வயிற்று வலி": "abdominal pain",
        "மயக்கம்": "dizziness",
        "இருமல்": "cough",
        "வாந்தி": "vomiting",
        "சளி": "cold / phlegm",
        "சர்க்கரை நோய்": "diabetes",
        "இரத்த அழுத்தம்": "hypertension",

        # Hindi
        "छाती में दर्द": "chest pain",
        "सांस लेने में तकलीफ": "shortness of breath",
        "बुखार": "fever",
        "सिरदर्द": "headache",
        "पेट दर्द": "abdominal pain",
        "चक्कर आना": "dizziness",
        "खांसी": "cough",
        "उल्टी": "vomiting",
        "दिल का दौरा": "heart attack",
        "मधुमेह": "diabetes",
        "उच्च रक्तचाप": "hypertension",

        # Telugu
        "ఛాతీ నొప్పి": "chest pain",
        "శ్వాస తీసుకోవడంలో ఇబ్బంది": "shortness of breath",
        "జ్వరం": "fever",
        "తలనొప్పి": "headache",
        "కడుపు నొప్పి": "abdominal pain",
        "దగ్గు": "cough",
        "వాంతులు": "vomiting",
        "గుండెపోటు": "heart attack",

        # Malayalam
        "നെഞ്ചുവേദന": "chest pain",
        "ശ്വാസതടസ്സം": "shortness of breath",
        "പനി": "fever",
        "തലവേദന": "headache",
        "വയറുവേദന": "abdominal pain",
        "ചുമ": "cough",
        "ഛർദ്ദി": "vomiting",
        "ഹൃദയാഘാതം": "heart attack",

        # Kannada
        "ಎದೆ ನೋವು": "chest pain",
        "ಉಸಿರಾಟದ ತೊಂದರೆ": "shortness of breath",
        "ಜ್ವರ": "fever",
        "ತಲೆನೋವು": "headache",
        "ಹೊಟ್ಟೆ ನೋವು": "abdominal pain",
        "ಕೆಮ್ಮು": "cough",
        "ವಾಂತಿ": "vomiting",
        "ಹೃದಯಾಘಾತ": "heart attack",
    }

    LANGUAGE_NAMES = {
        "en": "English",
        "ta": "Tamil (தமிழ்)",
        "hi": "Hindi (हिन्दी)",
        "te": "Telugu (తెలుగు)",
        "ml": "Malayalam (മലയാളം)",
        "kn": "Kannada (ಕನ್ನಡ)"
    }

    def normalize(self, text: str) -> Tuple[str, Optional[str], List[str]]:
        """
        Normalizes multilingual input to standard clinical terms.
        Returns: (normalized_text, detected_language, detected_medical_terms)
        """
        normalized = text
        detected_lang = "en"
        found_terms = []

        for non_en_term, standard_term in self.TERM_MAP.items():
            if non_en_term in text:
                found_terms.append(standard_term)
                # Append standard translation in parenthesis for LLM grounding
                normalized = normalized.replace(non_en_term, f"{non_en_term} ({standard_term})")
                
                # Detect language if non-English
                if any(ord(c) >= 0x0B80 and ord(c) <= 0x0BFF for c in non_en_term):
                    detected_lang = "ta"
                elif any(ord(c) >= 0x0900 and ord(c) <= 0x097F for c in non_en_term):
                    detected_lang = "hi"
                elif any(ord(c) >= 0x0C00 and ord(c) <= 0x0C7F for c in non_en_term):
                    detected_lang = "te"
                elif any(ord(c) >= 0x0D00 and ord(c) <= 0x0D7F for c in non_en_term):
                    detected_lang = "ml"
                elif any(ord(c) >= 0x0C80 and ord(c) <= 0x0CFF for c in non_en_term):
                    detected_lang = "kn"

        return normalized, detected_lang, found_terms

terminology_normalizer = MedicalTerminologyNormalizer()
