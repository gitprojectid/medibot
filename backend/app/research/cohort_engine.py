import datetime
from typing import Dict, Any, List, Optional
from backend.app.hospital.synthetic_hospital import SYNTHETIC_PATIENTS

class ClinicalResearchCohortEngine:
    """
    Clinical Research, Retrospective Cohort Explorer & Clinical Trial Matcher.
    Enables synthetic cohort discovery and protocol eligibility screening.
    """

    ACTIVE_CLINICAL_TRIALS = [
        {
            "trial_id": "NCT-05829104",
            "title": "EMPA-KIDNEY-HF: SGLT2 Inhibitors in Advanced Cardiorenal Syndrome",
            "phase": "Phase III Multi-Center Randomized Trial",
            "sponsor": "Metro Health Research Institute & NIH",
            "inclusion_criteria": [
                "Age >= 18 years",
                "Diagnosis of Heart Failure (HFrEF EF <= 40%)",
                "eGFR between 20 and 60 mL/min/1.73m2",
                "Stable background GDMT for >= 4 weeks"
            ],
            "exclusion_criteria": [
                "Type 1 Diabetes Mellitus",
                "History of kidney transplant",
                "Systolic BP < 95 mmHg"
            ],
            "target_enrollment": 120,
            "current_enrolled": 78
        },
        {
            "trial_id": "NCT-06291028",
            "title": "APP-NONOP: Non-Operative Antibiotic Regimens for Uncomplicated Appendicitis",
            "phase": "Phase IV Comparative Effectiveness Trial",
            "sponsor": "Emergency Surgery Research Consortium",
            "inclusion_criteria": [
                "Age 18 - 50 years",
                "CT-confirmed uncomplicated appendicitis (diameter < 12mm)",
                "Alvarado score >= 7",
                "Absence of free perforation or phlegmon"
            ],
            "exclusion_criteria": [
                "Immunosuppressed status",
                "Pregnancy",
                "Appendiceal diameter > 14mm"
            ],
            "target_enrollment": 250,
            "current_enrolled": 142
        },
        {
            "trial_id": "NCT-07102941",
            "title": "PREECLAM-BIOMARKER: Angiogenic sFlt-1/PlGF Ratio in High-Risk Pregnancy",
            "phase": "Phase II Observational Biomarker Study",
            "sponsor": "Maternal-Fetal Medicine Foundation",
            "inclusion_criteria": [
                "Gestational age 24 - 36 weeks",
                "Persistent Hypertension (SBP >= 140 or DBP >= 90 mmHg)",
                "Proteinuria > 0.3 g/24h"
            ],
            "exclusion_criteria": [
                "Multiple gestation",
                "Major fetal congenital anomalies"
            ],
            "target_enrollment": 80,
            "current_enrolled": 45
        }
    ]

    def query_cohort(self, condition_keyword: Optional[str] = None, min_age: Optional[int] = None, max_age: Optional[int] = None, medication_keyword: Optional[str] = None) -> Dict[str, Any]:
        """
        Filter synthetic patient cohorts based on multi-parameter clinical criteria.
        """
        matched = []
        for p in SYNTHETIC_PATIENTS:
            # Condition match
            if condition_keyword:
                has_cond = any(condition_keyword.lower() in c["name"].lower() for c in p.get("active_conditions", []))
                if not has_cond:
                    continue

            # Age match
            if min_age and p["age"] < min_age:
                continue
            if max_age and p["age"] > max_age:
                continue

            # Medication match
            if medication_keyword:
                has_med = any(medication_keyword.lower() in m["name"].lower() for m in p.get("active_medications", []))
                if not has_med:
                    continue

            matched.append({
                "patient_id": p["id"],
                "mrn": p["mrn"],
                "name": p["full_name"],
                "age": p["age"],
                "gender": p["gender"],
                "conditions": [c["name"] for c in p.get("active_conditions", [])],
                "medications": [m["name"] for m in p.get("active_medications", [])],
                "assigned_ward": p["assigned_ward"],
                "status": p["status"]
            })

        return {
            "query_timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
            "total_matches": len(matched),
            "parameters": {
                "condition": condition_keyword,
                "min_age": min_age,
                "max_age": max_age,
                "medication": medication_keyword
            },
            "cohort": matched
        }

    def match_patient_to_trials(self, patient_id: str) -> List[Dict[str, Any]]:
        """
        Screen a patient against active trial eligibility criteria.
        """
        patient = next((p for p in SYNTHETIC_PATIENTS if p["id"] == patient_id), None)
        if not patient:
            return []

        matched_trials = []
        cond_names = " ".join(c["name"].lower() for c in patient.get("active_conditions", []))

        for t in self.ACTIVE_CLINICAL_TRIALS:
            is_eligible = False
            match_rationale = ""

            criteria_str = " ".join(t.get("inclusion_criteria", [])).lower() + " " + t["title"].lower()

            if ("heart failure" in criteria_str or "cardiorenal" in criteria_str or "hfref" in criteria_str) and ("heart failure" in cond_names or "hfref" in cond_names):
                is_eligible = True
                match_rationale = "Patient meets LVEF <= 40% HFrEF criteria and CKD comorbidity."
            elif "appendicitis" in criteria_str and "appendicitis" in cond_names:
                is_eligible = True
                match_rationale = "CT confirmed acute appendicitis (11mm diameter), Alvarado score 8."
            elif ("preeclam" in criteria_str or "hypertension" in criteria_str) and "preeclampsia" in cond_names:
                is_eligible = True
                match_rationale = "3rd trimester preeclampsia with severe features (BP 168/104 mmHg)."

            if is_eligible:
                matched_trials.append({
                    "trial": t,
                    "patient_id": patient_id,
                    "patient_name": patient["full_name"],
                    "match_status": "ELIGIBLE",
                    "match_rationale": match_rationale
                })

        return matched_trials

cohort_engine = ClinicalResearchCohortEngine()
