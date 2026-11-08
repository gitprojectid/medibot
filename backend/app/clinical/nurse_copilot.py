import datetime
from typing import Dict, Any, List
from backend.app.hospital.synthetic_hospital import SYNTHETIC_PATIENTS, METRO_HOSPITAL
from backend.app.clinical.monitoring_engine import monitoring_engine

class NurseCopilotEngine:
    """
    Nurse AI Copilot & Inpatient Shift Handoff Engine.
    Generates structured SBAR (Situation, Background, Assessment, Recommendation) handoffs,
    vital alerts, and medication administration schedules.
    """

    def generate_ward_shift_handoff(self, ward_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate comprehensive clinical shift handoff for oncoming nursing staff.
        """
        patients = SYNTHETIC_PATIENTS
        if ward_id:
            patients = [p for p in SYNTHETIC_PATIENTS if p["assigned_ward"] == ward_id]

        handoff_patients = []
        high_risk_count = 0
        total_pending_meds = 0

        for p in patients:
            latest_vitals = p["vitals_time_series"][-1] if p.get("vitals_time_series") else {}
            news2 = monitoring_engine.calculate_news2(
                rr=latest_vitals.get("rr", 18),
                spo2=latest_vitals.get("spo2", 98),
                is_on_supplemental_o2="Nasal" in latest_vitals.get("o2_flow", "") or "High" in latest_vitals.get("o2_flow", ""),
                sbp=latest_vitals.get("sbp", 120),
                hr=latest_vitals.get("hr", 75),
                consciousness=latest_vitals.get("avpu", "Alert"),
                temp=latest_vitals.get("temp", 37.0)
            )

            if news2["risk_tier"] in ["HIGH", "MEDIUM"]:
                high_risk_count += 1

            # Build SBAR Summary for Patient
            sbar = {
                "situation": f"{p['full_name']} ({p['age']}yo {p['gender']}) in {p['room_bed']}. Admitted {p['admission_date'][:10]} for {p['chief_complaint']}.",
                "background": f"History of {', '.join(c['name'] for c in p.get('active_conditions', []))}. Allergies: {', '.join(a['allergen'] for a in p.get('allergies', [])) or 'NKDA'}.",
                "assessment": f"Latest NEWS2: {news2['total_score']} ({news2['risk_tier']} Risk). Vitals: BP {latest_vitals.get('sbp')}/{latest_vitals.get('dbp')}, HR {latest_vitals.get('hr')}, SpO2 {latest_vitals.get('spo2')}% on {latest_vitals.get('o2_flow', 'RA')}.",
                "recommendation": f"{news2['clinical_response']} Monitor vitals {news2['monitoring_frequency']}. Check pending lab draws."
            }

            # Medication Administration List
            med_schedule = []
            for m in p.get("active_medications", []):
                total_pending_meds += 1
                med_schedule.append({
                    "medication": m["name"],
                    "dose": m["dose"],
                    "route": m["route"],
                    "scheduled_time": "14:00 (Next Dose)",
                    "status": "Scheduled",
                    "precautions": "Check vitals prior to administration" if "Beta" in m.get("indication", "") or "Antihypertensive" in m.get("indication", "") else "Standard administration"
                })

            handoff_patients.append({
                "patient_id": p["id"],
                "mrn": p["mrn"],
                "name": p["full_name"],
                "room_bed": p["room_bed"],
                "ward": p["assigned_ward"],
                "primary_nurse": p["primary_nurse"],
                "attending": p["attending_physician"],
                "news2": news2,
                "sbar": sbar,
                "med_schedule": med_schedule,
                "care_tasks": [
                    "Perform strict intake/output charting",
                    "Reposition patient Q2H for pressure injury prevention",
                    "Morning blood draw at 06:00"
                ]
            })

        return {
            "shift": "Day Shift (07:00 - 19:00) Handoff Summary",
            "hospital": METRO_HOSPITAL["name"],
            "generated_at": datetime.datetime.utcnow().isoformat(),
            "total_assigned_patients": len(handoff_patients),
            "high_risk_patients_count": high_risk_count,
            "total_scheduled_meds": total_pending_meds,
            "patients": handoff_patients
        }

nurse_copilot = NurseCopilotEngine()
