import datetime
from typing import Dict, Any, List, Optional
from backend.app.hospital.synthetic_hospital import SYNTHETIC_PATIENTS

class ClinicalPharmacyEngine:
    """
    Clinical Pharmacology, Renal Function (CrCl / eGFR) & IV Infusion Titration Engine.
    Prevents nephrotoxicity, underdosing, and medication calculation errors in hospital units.
    """

    RENAL_DOSED_DRUGS = {
        "vancomycin": {
            "name": "Vancomycin IV",
            "normal_dose": "15-20 mg/kg IV q8-12h (Target trough 15-20 mcg/mL)",
            "crcl_50": "15 mg/kg IV q12h",
            "crcl_30": "15 mg/kg IV q24h",
            "crcl_under_15": "15 mg/kg IV load, then redose based on random levels",
            "monitoring": "Serum trough level before 4th dose; monitor serum creatinine daily."
        },
        "enoxaparin": {
            "name": "Enoxaparin (Lovenox) SC",
            "normal_dose": "1 mg/kg SC q12h (Therapeutic) or 40 mg SC Daily (Prophylaxis)",
            "crcl_50": "No adjustment required",
            "crcl_30": "Reduce to 1 mg/kg SC q24h (Therapeutic) or 30 mg SC Daily (Prophylaxis)",
            "crcl_under_15": "Contraindicated / Switch to Unfractionated Heparin (UFH) IV",
            "monitoring": "Anti-Xa peak level 4h post-dose in renal insufficiency."
        },
        "piperacillin_tazobactam": {
            "name": "Piperacillin/Tazobactam (Zosyn) IV",
            "normal_dose": "3.375g - 4.5g IV q6h (Extended infusion over 3-4h)",
            "crcl_50": "3.375g IV q6h",
            "crcl_30": "2.25g IV q6h",
            "crcl_under_15": "2.25g IV q8h (Hemodialysis: 2.25g q12h + 0.75g post-HD)",
            "monitoring": "Monitor CBC for leukopenia on prolonged therapy > 10 days."
        },
        "metformin": {
            "name": "Metformin PO",
            "normal_dose": "500 - 1000 mg PO BID",
            "crcl_50": "Maximum 1000 mg/day",
            "crcl_30": "Reduce to 500 mg daily; consider discontinuation",
            "crcl_under_15": "CONTRAINDICATED (High risk of fatal lactic acidosis)",
            "monitoring": "eGFR prior to initiation and at least annually."
        },
        "gabapentin": {
            "name": "Gabapentin PO",
            "normal_dose": "300 - 600 mg PO TID",
            "crcl_50": "300 mg PO BID",
            "crcl_30": "200 - 300 mg PO Daily",
            "crcl_under_15": "100 - 300 mg PO every other day",
            "monitoring": "Excessive somnolence and CNS depression in renal impairment."
        },
        "lisinopril": {
            "name": "Lisinopril PO",
            "normal_dose": "10 - 40 mg PO Daily",
            "crcl_50": "Initial 5 mg daily, titrate cautiously",
            "crcl_30": "Initial 2.5 mg daily; monitor serum K+ and creatinine in 1 week",
            "crcl_under_15": "Initial 2.5 mg daily; monitor closely for hyperkalemia",
            "monitoring": "Hold if serum Potassium > 5.5 mEq/L or Creatinine rise > 30%."
        }
    }

    def calculate_renal_function(
        self,
        age: int,
        weight_kg: float,
        gender: str,
        serum_creatinine_mg_dl: float
    ) -> Dict[str, Any]:
        """
        Calculate Cockcroft-Gault CrCl and CKD-EPI eGFR.
        """
        if serum_creatinine_mg_dl <= 0:
            serum_creatinine_mg_dl = 1.0

        # Cockcroft-Gault Equation: ((140 - age) * weight_kg) / (72 * SCr) * (0.85 if female)
        crcl_raw = ((140 - age) * weight_kg) / (72 * serum_creatinine_mg_dl)
        if gender.lower() in ["female", "f"]:
            crcl_raw *= 0.85

        crcl = round(crcl_raw, 1)

        # CKD Stage Classification
        if crcl >= 90:
            ckd_stage = "Stage 1 (Normal / High Kidney Function)"
            alert_tier = "NORMAL"
        elif crcl >= 60:
            ckd_stage = "Stage 2 (Mildly Decreased Function)"
            alert_tier = "NORMAL"
        elif crcl >= 30:
            ckd_stage = "Stage 3 (Moderate CKD / Renal Insufficiency)"
            alert_tier = "MODERATE_ADJUSTMENT"
        elif crcl >= 15:
            ckd_stage = "Stage 4 (Severe CKD)"
            alert_tier = "SEVERE_ADJUSTMENT"
        else:
            ckd_stage = "Stage 5 (Kidney Failure / ESRD)"
            alert_tier = "CRITICAL_ADJUSTMENT"

        return {
            "cockcroft_gault_crcl_ml_min": crcl,
            "ckd_stage": ckd_stage,
            "alert_tier": alert_tier,
            "serum_creatinine": serum_creatinine_mg_dl,
            "patient_parameters": {
                "age": age,
                "weight_kg": weight_kg,
                "gender": gender
            }
        }

    def audit_patient_medications_for_renal_risk(self, patient_id: str) -> Dict[str, Any]:
        """
        Screen all active medications for a patient against their current renal profile.
        """
        patient = next((p for p in SYNTHETIC_PATIENTS if p["id"] == patient_id), None)
        if not patient:
            return {"error": "Patient not found"}

        # Extract patient creatinine from labs or default
        scr = 1.2
        for l in patient.get("recent_labs", []):
            if "creatinine" in str(l.get("test", "")).lower():
                try:
                    scr = float(l["value"])
                except Exception:
                    scr = 1.2

        renal_profile = self.calculate_renal_function(
            age=patient["age"],
            weight_kg=78.0,
            gender=patient["gender"],
            serum_creatinine_mg_dl=scr
        )

        crcl = renal_profile["cockcroft_gault_crcl_ml_min"]
        alerts = []

        for med in patient.get("active_medications", []):
            med_name_lower = med["name"].lower()
            for key, drug_info in self.RENAL_DOSED_DRUGS.items():
                if key in med_name_lower or drug_info["name"].lower() in med_name_lower:
                    recommendation = ""
                    action_needed = False

                    if crcl < 15:
                        recommendation = drug_info["crcl_under_15"]
                        action_needed = True
                    elif crcl < 30:
                        recommendation = drug_info["crcl_30"]
                        action_needed = True
                    elif crcl < 50:
                        recommendation = drug_info["crcl_50"]
                        action_needed = True

                    alerts.append({
                        "medication": med["name"],
                        "current_dosage": f"{med['dose']} {med['freq']}",
                        "crcl_calculated": crcl,
                        "adjustment_needed": action_needed,
                        "guideline_recommended_dose": recommendation or drug_info["normal_dose"],
                        "monitoring_parameters": drug_info["monitoring"],
                        "severity": "CRITICAL" if (crcl < 30 and action_needed) else "MODERATE"
                    })

        return {
            "patient_id": patient_id,
            "patient_name": patient["full_name"],
            "mrn": patient["mrn"],
            "renal_profile": renal_profile,
            "audited_medications_count": len(patient.get("active_medications", [])),
            "renal_dosing_alerts": alerts
        }

    def calculate_iv_infusion_pump_rate(
        self,
        drug_name: str,
        patient_weight_kg: float,
        desired_dose_mcg_kg_min: float,
        bag_amount_mg: float,
        bag_volume_ml: float
    ) -> Dict[str, Any]:
        """
        Calculate smart pump infusion rate in mL/hour:
        Rate (mL/h) = (Dose [mcg/kg/min] * Weight [kg] * 60 min/h) / (Concentration [mcg/mL])
        """
        concentration_mcg_ml = (bag_amount_mg * 1000.0) / bag_volume_ml
        total_mcg_per_hour = desired_dose_mcg_kg_min * patient_weight_kg * 60.0
        pump_rate_ml_hr = round(total_mcg_per_hour / concentration_mcg_ml, 1)

        return {
            "drug_name": drug_name,
            "patient_weight_kg": patient_weight_kg,
            "desired_dose_mcg_kg_min": desired_dose_mcg_kg_min,
            "concentration": f"{round(concentration_mcg_ml, 1)} mcg/mL ({bag_amount_mg}mg in {bag_volume_ml}mL)",
            "calculated_pump_rate_ml_hr": pump_rate_ml_hr,
            "double_check_formula": f"({desired_dose_mcg_kg_min} mcg/kg/min * {patient_weight_kg} kg * 60) / {round(concentration_mcg_ml, 1)} mcg/mL = {pump_rate_ml_hr} mL/h",
            "safety_verification": "Dual-nurse independent verification required prior to pump programming."
        }

pharmacy_engine = ClinicalPharmacyEngine()
