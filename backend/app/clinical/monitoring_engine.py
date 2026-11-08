import datetime
from typing import Dict, Any, Optional, List

class ClinicalMonitoringEngine:
    """
    Deterministic Clinical Early Warning & Deterioration Engine.
    Implements official Royal College of Physicians NEWS2 and Sepsis qSOFA protocols.
    """

    def calculate_news2(
        self,
        rr: int,
        spo2: float,
        is_on_supplemental_o2: bool,
        sbp: int,
        hr: int,
        consciousness: str = "Alert", # "Alert", "Voice", "Pain", "Unresponsive", "Confused"
        temp: float = 37.0
    ) -> Dict[str, Any]:
        """
        Calculate standard Royal College of Physicians NEWS2 score.
        """
        score = 0
        breakdown = {}

        # 1. Respiration Rate (breaths/min)
        if rr <= 8:
            rr_score = 3
        elif 9 <= rr <= 11:
            rr_score = 1
        elif 12 <= rr <= 20:
            rr_score = 0
        elif 21 <= rr <= 24:
            rr_score = 2
        else: # >= 25
            rr_score = 3
        score += rr_score
        breakdown["respiration_rate"] = {"value": rr, "score": rr_score}

        # 2. Oxygen Saturation (SpO2 %)
        if spo2 <= 91:
            spo2_score = 3
        elif 92 <= spo2 <= 93:
            spo2_score = 2
        elif 94 <= spo2 <= 95:
            spo2_score = 1
        else: # >= 96
            spo2_score = 0
        score += spo2_score
        breakdown["oxygen_saturation"] = {"value": spo2, "score": spo2_score}

        # 3. Supplemental Oxygen
        o2_score = 2 if is_on_supplemental_o2 else 0
        score += o2_score
        breakdown["supplemental_o2"] = {"value": "Yes" if is_on_supplemental_o2 else "Room Air", "score": o2_score}

        # 4. Systolic Blood Pressure (mmHg)
        if sbp <= 90:
            sbp_score = 3
        elif 91 <= sbp <= 100:
            sbp_score = 2
        elif 101 <= sbp <= 110:
            sbp_score = 1
        elif 111 <= sbp <= 219:
            sbp_score = 0
        else: # >= 220
            sbp_score = 3
        score += sbp_score
        breakdown["systolic_bp"] = {"value": sbp, "score": sbp_score}

        # 5. Heart Rate / Pulse (bpm)
        if hr <= 40:
            hr_score = 3
        elif 41 <= hr <= 50:
            hr_score = 1
        elif 51 <= hr <= 90:
            hr_score = 0
        elif 91 <= hr <= 110:
            hr_score = 1
        elif 111 <= hr <= 130:
            hr_score = 2
        else: # >= 131
            hr_score = 3
        score += hr_score
        breakdown["heart_rate"] = {"value": hr, "score": hr_score}

        # 6. Consciousness (AVPU scale)
        c_lower = consciousness.lower()
        if "alert" in c_lower and "confused" not in c_lower:
            c_score = 0
        else:
            c_score = 3 # Voice, Pain, Unresponsive, or New Confusion
        score += c_score
        breakdown["consciousness"] = {"value": consciousness, "score": c_score}

        # 7. Temperature (°C)
        if temp <= 35.0:
            temp_score = 3
        elif 35.1 <= temp <= 36.0:
            temp_score = 1
        elif 36.1 <= temp <= 38.0:
            temp_score = 0
        elif 38.1 <= temp <= 39.0:
            temp_score = 1
        else: # >= 39.1
            temp_score = 2
        score += temp_score
        breakdown["temperature"] = {"value": temp, "score": temp_score}

        # Clinical Risk Stratification & Recommended Clinical Response
        has_single_red_flag = any(v["score"] == 3 for v in breakdown.values())

        if score >= 7:
            risk_tier = "HIGH"
            clinical_response = "EMERGENCY: Immediate assessment by Critical Care Outreach / Medical Emergency Team (MET). Consider ICU transfer."
            frequency = "Continuous monitoring / Q15 min"
            badge_color = "red"
        elif score >= 5 or has_single_red_flag:
            risk_tier = "MEDIUM"
            clinical_response = "URGENT: Urgent clinical review by Ward Doctor / Rapid Response Team within 60 minutes."
            frequency = "Hourly vital sign monitoring"
            badge_color = "amber"
        elif 1 <= score <= 4:
            risk_tier = "LOW"
            clinical_response = "ROUTINE: Ward-based nurse observation and monitoring."
            frequency = "Vital sign checks every 4 to 6 hours"
            badge_color = "emerald"
        else:
            risk_tier = "NORMAL"
            clinical_response = "STABLE: Standard baseline hospital observation."
            frequency = "Routine checks every 12 hours"
            badge_color = "blue"

        return {
            "total_score": score,
            "risk_tier": risk_tier,
            "has_single_red_flag": has_single_red_flag,
            "clinical_response": clinical_response,
            "monitoring_frequency": frequency,
            "badge_color": badge_color,
            "breakdown": breakdown,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }

    def calculate_qsofa(self, sbp: int, rr: int, altered_mental_status: bool) -> Dict[str, Any]:
        """
        Quick Sepsis-related Organ Failure Assessment (qSOFA) Calculator.
        """
        score = 0
        criteria = []

        if sbp <= 100:
            score += 1
            criteria.append("Systolic BP <= 100 mmHg")
        if rr >= 22:
            score += 1
            criteria.append("Respiratory Rate >= 22 breaths/min")
        if altered_mental_status:
            score += 1
            criteria.append("Altered Mental Status (GCS < 15)")

        is_high_risk = score >= 2

        return {
            "qsofa_score": score,
            "is_high_risk_sepsis": is_high_risk,
            "criteria_met": criteria,
            "recommendation": "CRITICAL SEPSIS ALERT: Lactate draw, blood cultures x2, broad-spectrum IV antibiotics within 1 hr, and 30 mL/kg IV crystalloid fluid bolus." if is_high_risk else "qSOFA negative (<2). Continue standard monitoring."
        }

monitoring_engine = ClinicalMonitoringEngine()
