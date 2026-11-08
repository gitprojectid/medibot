import re
from typing import Dict, Any, Optional, List
from backend.app.config import settings

class EmergencyEngine:
    """
    Exhaustive Clinical Emergency & Red-Flag Interceptor.
    Evaluates patient symptoms against 16 critical emergency categories deterministically.
    """

    EMERGENCY_RULES: List[Dict[str, Any]] = [
        # 1. Cardiovascular Emergencies
        {
            "category": "Cardiovascular Emergency / Acute Coronary Syndrome",
            "keywords": [
                r"\b(crushing|heavy|squeezing|severe|pressure|tightness)\s+(chest|substernal)\s+(pain|pressure|tightness|discomfort)\b",
                r"\bchest\s+pain\b.*\b(radiat|left\s+arm|jaw|neck|back|shoulder|sweat|diaphor|nausea|shortness\s+of\s+breath|vomit)\b",
                r"\bheart\s+attack\b",
                r"\b(tearing|ripping|knife-like)\s+(chest|back|interscapular)\s+pain\b", # Aortic Dissection
                r"\bsudden\s+cardiac\s+(arrest|collapse)\b",
                r"\bchest\s+pressure\b.*\b(cold\s+sweat|dizz|faint|syncope|lightheaded)\b"
            ],
            "action": "Immediate 911 / Emergency Medical Services dispatch. Have patient sit upright at rest. If no allergy or active bleeding, chew one non-enteric 325mg Aspirin while awaiting EMS.",
            "phone": settings.EMERGENCY_PHONE_DEFAULT,
            "disclaimer": "Your symptoms match red-flag criteria for acute myocardial infarction or acute aortic syndrome. Call 911 immediately; do not drive yourself to the hospital."
        },

        # 2. Stroke & Acute Neurological Deficits
        {
            "category": "Stroke / Acute Cerebrovascular Event (FAST Protocol)",
            "keywords": [
                r"\b(face|facial)\s+(droop|drooping|numb|paraly|asymmetry)\b",
                r"\b(slurr|slurred|unable\s+to\s+speak|garbled|difficulty\s+speaking|aphasia|word-finding)\s+(speech|words)\b",
                r"\b(arm|leg)\s+(weakness|numbness|paralysis|drift)\s+(on\s+one\s+side|unilateral|sudden)\b",
                r"\bsudden\s+(loss\s+of\s+vision|blindness|double\s+vision|diplopia|hemivis)\b",
                r"\bthunderclap\s+headache\b",
                r"\bworst\s+headache\s+of\s+(my\s+)?life\b",
                r"\bsudden\s+facial\s+droop\b",
                r"\bstroke\s+symptoms?\b",
                r"\bsudden\s+(inability\s+to\s+walk|loss\s+of\s+balance|ataxia)\b"
            ],
            "action": "Immediate 911 dispatch. Record exact 'Last Known Well' time. Do NOT administer aspirin or food/water until CT scan rules out hemorrhagic stroke in emergency room.",
            "phone": settings.EMERGENCY_PHONE_DEFAULT,
            "disclaimer": "Sudden facial drooping, arm weakness, speech difficulty, or thunderclap headache indicate an acute stroke requiring emergency care within the time-sensitive thrombolytic window."
        },

        # 3. Severe Respiratory Distress & Airway Compromise
        {
            "category": "Severe Respiratory Distress / Airway Obstruction",
            "keywords": [
                r"\b(can'?t|cannot|unable\s+to)\s+breathe\b",
                r"\bsevere\s+(shortness\s+of\s+breath|difficulty\s+breathing|breathlessness|dyspnea)\b",
                r"\b(blue|bluish|cyanot|gray)\s+(lips|face|fingers|skin|nailbeds)\b",
                r"\b(gasping|stridor|choking|suffocating|tracheal\s+tug)\b",
                r"\bthroat\s+closing\s+(up)?\b",
                r"\b(unable\s+to|can'?t)\s+(speak|talk)\s+in\s+full\s+sentences\b"
            ],
            "action": "Immediate emergency evaluation for acute respiratory failure, severe asthma exacerbation, or foreign body airway obstruction. Keep patient in seated upright position.",
            "phone": settings.EMERGENCY_PHONE_DEFAULT,
            "disclaimer": "Severe shortness of breath, cyanosis, and inability to speak indicate critical oxygenation failure requiring immediate emergency resuscitation."
        },

        # 4. Anaphylaxis & Acute Angioedema
        {
            "category": "Anaphylaxis & Acute Airway Angioedema",
            "keywords": [
                r"\b(anaphyla|allergic\s+reaction)\b.*\b(swelling|breath|hives|throat|tongue|wheez)\b",
                r"\b(tongue|lip|throat|uvula|mouth)\s+(is\s+)?swell(ing|ed)?\b",
                r"\bthroat\b.*\b(closing|closing\s+up|swelling)\b",
                r"\bhives\b.*\b(difficulty\s+breathing|dizziness|fainting|wheezing|throat\s+tightness)\b",
                r"\bepipen\b"
            ],
            "action": "Immediate intramuscular Epinephrine (EpiPen) into outer mid-thigh. Call 911 immediately, even if symptoms improve after Epinephrine, due to bi-phasic reaction risk.",
            "phone": settings.EMERGENCY_PHONE_DEFAULT,
            "disclaimer": "Rapidly developing facial or airway swelling with breathing difficulty represents life-threatening anaphylaxis."
        },

        # 5. Severe Hemorrhage & Hypovolemic Shock
        {
            "category": "Severe Hemorrhage / Uncontrolled Bleeding / Shock",
            "keywords": [
                r"\b(uncontrolled|profuse|massive|spurting|gushing)\s+bleeding\b",
                r"\bvomi(t|ting)\s+(bright\s+red\s+blood|coffee\s+ground)\b",
                r"\b(hematemesis|coughing\s+up\s+blood|massive\s+hemoptysis)\b",
                r"\b(black\s+tarry\s+stools|melena)\b.*\b(dizz|faint|syncope|weak|sweat)\b",
                r"\bshock\b.*\b(low\s+blood\s+pressure|pale|clammy|cold\s+sweat)\b"
            ],
            "action": "Call 911. Apply direct continuous firm pressure with clean cloth over external bleeding. Keep patient lying down with legs elevated unless breathing is compromised.",
            "phone": settings.EMERGENCY_PHONE_DEFAULT,
            "disclaimer": "Active vomiting of blood, melena with dizziness, or uncontrolled arterial bleeding indicate critical vascular compromise."
        },

        # 6. Poisoning, Toxic Ingestion & Overdose
        {
            "category": "Poisoning / Drug Overdose / Toxic Inhalation",
            "keywords": [
                r"\b(swallowed|drank|ingested)\s+(poison|bleach|chemical|cleaner|battery|draino|antifreeze|pills)\b",
                r"\b(overdose|od'd|took\s+too\s+many\s+pills|fentanyl|heroin|opioid)\b",
                r"\bcarbon\s+monoxide\b.*\b(dizz|headache|confus|unconscious)\b",
                r"\bpinpoint\s+pupils\b.*\b(unresponsive|slow\s+breathing)\b",
                r"\bpoison\s+control\b"
            ],
            "action": "Immediate emergency care. If opioid overdose is suspected and Naloxone (Narcan) is available, administer nasal Narcan immediately and call 911. Contact Poison Control (1-800-222-1222). Do NOT induce vomiting unless instructed by poison control.",
            "phone": settings.EMERGENCY_PHONE_DEFAULT,
            "disclaimer": "Toxic ingestions and drug overdoses require immediate emergency stabilization. Bring medication bottles/substance containers to the hospital."
        },

        # 7. Sepsis & Severe Systemic Infection (qSOFA)
        {
            "category": "Severe Sepsis / Septic Shock / Bacterial Meningitis",
            "keywords": [
                r"\bsepsis\b",
                r"\bhigh\s+fever\b.*\b(stiff\s+neck|purple\s+rash|petechiae|photophobia|severe\s+headache)\b",
                r"\bhigh\s+fever\b.*\b(confusion|unresponsive|lethargic|delir|shaking\s+chills|mottled\s+skin|rapid\s+breathing)\b",
                r"\bextreme\s+shivering\b.*\b(confus|breathless|very\s+low\s+blood\s+pressure)\b"
            ],
            "action": "Immediate emergency room transfer. Stiff neck with fever and rash suggests acute bacterial meningitis requiring urgent lumbar puncture and IV antibiotics.",
            "phone": settings.EMERGENCY_PHONE_DEFAULT,
            "disclaimer": "Signs of severe infection combined with altered mental status, stiff neck, or low blood pressure represent a critical medical emergency."
        },

        # 8. Acute Surgical Abdomen & Peritonitis
        {
            "category": "Acute Surgical Abdomen / Appendicitis / Perforation",
            "keywords": [
                r"\bsevere\s+rebound\s+tenderness\b",
                r"\bboard-like\s+(rigid|hardness)\s+abdomen\b",
                r"\bsevere\s+right\s+lower\s+quadrant\s+pain\b.*\b(fever|vomit|rebound)\b",
                r"\b(peritonitis|bowel\s+perforation)\b",
                r"\bsevere\s+abdominal\s+pain\b.*\b(fever|cannot\s+stand\s+upright|rigid|black\s+stool)\b"
            ],
            "action": "Immediate surgical evaluation. Keep patient NPO (no food or water) in preparation for potential emergency surgery and imaging.",
            "phone": settings.EMERGENCY_PHONE_DEFAULT,
            "disclaimer": "Involuntary abdominal rigidity, severe focal guarding, and high fever suggest an acute intra-abdominal surgical emergency."
        },

        # 9. Cauda Equina & Acute Spinal Compression
        {
            "category": "Cauda Equina Syndrome / Acute Spinal Cord Injury",
            "keywords": [
                r"\b(back\s+pain|sciatica|spine)\b.*\b(numbness\s+in\s+groin|saddle\s+anesthesia|loss\s+of\s+bladder|loss\s+of\s+bowel|incontinence)\b",
                r"\bsaddle\s+anesthesia\b",
                r"\bbilateral\s+leg\s+weakness\b.*\b(incontinence|numbness\s+around\s+anus|urinary\s+retention)\b",
                r"\bsudden\s+paralysis\s+of\s+legs\b"
            ],
            "action": "Immediate emergency spine MRI and urgent neurosurgical decompression within 24-48 hours to prevent irreversible paraplegia and permanent loss of bowel/bladder function.",
            "phone": settings.EMERGENCY_PHONE_DEFAULT,
            "disclaimer": "Severe back pain accompanied by saddle area numbness or new urinary/fecal incontinence is a surgical emergency."
        },

        # 10. Obstetric Emergencies (Maternal-Fetal)
        {
            "category": "Obstetric Emergency / Preeclampsia / Eclampsia",
            "keywords": [
                r"\bpregnant\b.*\b(heavy\s+vaginal\s+bleeding|severe\s+abdominal\s+pain|water\s+broke\s+with\s+cord|no\s+fetal\s+movement)\b",
                r"\b(pregnant|pregnancy)\b.*\b(severe\s+headache\s+with\s+vision\s+changes|seizure|epigastric\s+pain\s+and\s+high\s+bp)\b",
                r"\beclampsia\b",
                r"\bectopic\s+pregnancy\b"
            ],
            "action": "Immediate transfer to an Emergency Obstetric Triage Unit. Place patient in left lateral tilt to relieve vena cava compression.",
            "phone": settings.EMERGENCY_PHONE_DEFAULT,
            "disclaimer": "Heavy bleeding, severe headache with blurred vision, or seizure in pregnancy represents an immediate threat to maternal and fetal life."
        },

        # 11. Severe Traumatic Brain Injury (TBI) & Head Trauma
        {
            "category": "Severe Head Trauma / Traumatic Brain Injury",
            "keywords": [
                r"\bhead\s+(injury|trauma|hit)\b.*\b(loss\s+of\s+consciousness|knocked\s+out|repeated\s+vomiting|unequal\s+pupils|clear\s+fluid\s+from\s+nose|seizure)\b",
                r"\bconcussion\b.*\b(cannot\s+wake\s+up|worsening\s+confusion|slurred\s+speech)\b",
                r"\bbasilar\s+skull\s+fracture\b"
            ],
            "action": "Immediate emergency trauma evaluation and non-contrast head CT. Immobilize cervical spine if mechanism of injury involves high-energy impact/fall.",
            "phone": settings.EMERGENCY_PHONE_DEFAULT,
            "disclaimer": "Head trauma with loss of consciousness, unequal pupils, or clear fluid drainage from nose/ears indicates possible intracranial hemorrhage or skull fracture."
        },

        # 12. Ocular Emergencies & Acute Vision Loss
        {
            "category": "Ocular Emergency / Acute Vision Loss / Chemical Burn",
            "keywords": [
                r"\bsudden\s+(total\s+blindness|loss\s+of\s+vision\s+in\s+one\s+eye|dark\s+curtain\s+falling)\b",
                r"\bchemical\s+(splash|burn)\s+(in|to)\s+(eye|eyes)\b",
                r"\bsevere\s+eye\s+pain\b.*\b(halo|cloudy\s+cornea|nausea|vomiting)\b"
            ],
            "action": "For chemical eye splash: immediately flush eye with continuous clean water or saline for 15-20 minutes and proceed directly to emergency room. For sudden painless vision loss: immediate ophthalmology emergency consult.",
            "phone": settings.EMERGENCY_PHONE_DEFAULT,
            "disclaimer": "Sudden vision loss, severe eye pain with rainbow halos, or chemical burns require immediate emergency ophthalmic care to prevent permanent blindness."
        },

        # 13. Environmental Emergencies (Heat Stroke / Hypothermia)
        {
            "category": "Environmental Crisis / Heat Stroke / Severe Hypothermia",
            "keywords": [
                r"\bheat\s+stroke\b",
                r"\bextremely\s+hot\s+skin\b.*\b(no\s+sweating|confus|seizure|faint|unconscious|temperature\s+over\s+104)\b",
                r"\bsevere\s+hypothermia\b.*\b(stopped\s+shivering|unresponsive|slow\s+pulse)\b"
            ],
            "action": "For Heat Stroke: call 911 immediately, move to cool shade, initiate rapid active cooling (cold water immersion, ice packs to neck/groin/axillae). For Hypothermia: gentle passive rewarming, remove wet clothes, prevent cardiac irritability.",
            "phone": settings.EMERGENCY_PHONE_DEFAULT,
            "disclaimer": "Heat stroke with altered mental status or core body temperature >= 104°F is a life-threatening thermal emergency."
        },

        # 14. Severe Burns & Electrical Shock
        {
            "category": "Major Burns / Inhalation Injury / High Voltage Shock",
            "keywords": [
                r"\b(third\s+degree|full\s+thickness|severe)\s+burns?\b",
                r"\bburns?\b.*\b(face|hands|groin|airway|soot\s+in\s+mouth|singed\s+nasal\s+hairs)\b",
                r"\bhigh\s+voltage\s+electrical\s+shock\b"
            ],
            "action": "Call 911 immediately. Stop the burning process with cool clean water (do not use ice). Cover with clean dry sterile cloth. Do not apply ointments.",
            "phone": settings.EMERGENCY_PHONE_DEFAULT,
            "disclaimer": "Airway inhalation burns or extensive full-thickness burns require specialized emergency burn center management."
        },

        # 15. Pediatric & Neonatal Critical Emergencies
        {
            "category": "Pediatric / Neonatal Critical Emergency",
            "keywords": [
                r"\b(baby|infant|newborn)\b.*\b(fever|100\.4|lethargic|will\s+not\s+wake|grunting|blue\s+lips|bulging\s+soft\s+spot)\b",
                r"\bchild\b.*\b(grunting|stridor\s+at\s+rest|barking\s+cough\s+with\s+blue\s+lips|retractions|unresponsive)\b",
                r"\bpediatric\s+seizure\b"
            ],
            "action": "Immediate emergency pediatrician / emergency room care. Infants under 3 months with fever >= 100.4°F require full emergency septic workup.",
            "phone": settings.EMERGENCY_PHONE_DEFAULT,
            "disclaimer": "Lethargy, grunting, chest retractions, or fever in young infants represent urgent pediatric emergencies."
        },

        # 16. Acute Mental Health Crisis & Suicide Prevention (988)
        {
            "category": "Acute Mental Health Crisis / Suicide Risk (988 Lifeline)",
            "keywords": [
                r"\b(want\s+to|going\s+to|planning\s+to)\s+(kill|end\s+my\s+life|die|commit\s+suicide)\b",
                r"\b(suicid|kill\s+myself|end\s+it\s+all|take\s+my\s+own\s+life)\b",
                r"\bsevere\s+self-harm\b",
                r"\bhearing\s+voices\s+telling\s+me\s+to\s+(kill|harm)\b"
            ],
            "action": "Immediate connection to 988 Suicide & Crisis Lifeline (call or text 988, available 24/7/365, free and confidential) or call 911 for immediate safety.",
            "phone": settings.EMERGENCY_HELPLINE_CRISIS,
            "disclaimer": "If you are experiencing overwhelming emotional pain or thoughts of suicide, compassionate support is available right now. Please call or text 988 to speak immediately with a crisis counselor."
        }
    ]

    def evaluate(self, user_text: str, patient_context: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """
        Evaluate user message against all 16 emergency rules deterministically.
        Returns matched emergency metadata, guidance, and direct helpline numbers.
        """
        text_lower = user_text.lower().strip()

        is_pregnant = False
        if patient_context:
            is_pregnant = patient_context.get("is_pregnant", False)

        for rule in self.EMERGENCY_RULES:
            # Contextual obstetric check
            if "Obstetric" in rule["category"] and not is_pregnant and "pregnant" not in text_lower:
                continue

            for pattern in rule["keywords"]:
                if re.search(pattern, text_lower, re.IGNORECASE):
                    return {
                        "is_emergency": True,
                        "triage_level": 4,
                        "category": rule["category"],
                        "action": rule["action"],
                        "phone": rule["phone"],
                        "disclaimer": rule["disclaimer"],
                        "matched_pattern": pattern
                    }
        return None

# Singleton instance
emergency_engine = EmergencyEngine()
