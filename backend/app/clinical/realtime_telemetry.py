import random
import datetime
from typing import Dict, Any, List
from backend.app.hospital.synthetic_hospital import SYNTHETIC_PATIENTS
from backend.app.clinical.monitoring_engine import monitoring_engine

class RealTimeTelemetryEngine:
    """
    Real-Time Clinical Telemetry, Bedside Vitals Stream & Ward Alarm Dispatcher.
    Simulates real-time patient physiological fluctuations and automated escalation alerts.
    """

    def get_live_patient_vitals(self, patient_id: str) -> Dict[str, Any]:
        """
        Generate real-time physiological vitals stream with slight natural cardiac & respiratory variance.
        """
        patient = next((p for p in SYNTHETIC_PATIENTS if p["id"] == patient_id), None)
        if not patient:
            # Fallback baseline
            base_hr = 76
            base_sbp = 122
            base_dbp = 78
            base_rr = 18
            base_spo2 = 98.0
            base_temp = 37.0
            o2_flow = "Room Air"
            avpu = "Alert"
            name = "Inpatient Telemetry Stream"
        else:
            latest = patient["vitals_time_series"][-1]
            base_hr = latest["hr"]
            base_sbp = latest["sbp"]
            base_dbp = latest["dbp"]
            base_rr = latest["rr"]
            base_spo2 = latest["spo2"]
            base_temp = latest.get("temp", 37.0)
            o2_flow = latest.get("o2_flow", "Room Air")
            avpu = latest.get("avpu", "Alert")
            name = patient["full_name"]

        # Natural physiological jitter
        live_hr = max(40, min(180, base_hr + random.randint(-2, 3)))
        live_sbp = max(70, min(230, base_sbp + random.randint(-3, 4)))
        live_dbp = max(40, min(130, base_dbp + random.randint(-2, 2)))
        live_rr = max(8, min(40, base_rr + random.randint(-1, 1)))
        live_spo2 = max(80.0, min(100.0, round(base_spo2 + random.uniform(-0.5, 0.4), 1)))
        live_temp = round(base_temp + random.uniform(-0.1, 0.1), 1)

        # Recalculate deterministic NEWS2 in real-time
        news2 = monitoring_engine.calculate_news2(
            rr=live_rr,
            spo2=live_spo2,
            is_on_supplemental_o2="Nasal" in o2_flow or "High" in o2_flow,
            sbp=live_sbp,
            hr=live_hr,
            consciousness=avpu,
            temp=live_temp
        )

        # Cardiac rhythm telemetry classification
        if live_hr > 100:
            rhythm = "Sinus Tachycardia"
        elif live_hr < 60:
            rhythm = "Sinus Bradycardia"
        else:
            rhythm = "Normal Sinus Rhythm (NSR)"

        # Mean Arterial Pressure (MAP) = (2*DBP + SBP)/3
        map_val = round((2 * live_dbp + live_sbp) / 3, 1)

        return {
            "patient_id": patient_id,
            "patient_name": name,
            "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
            "telemetry": {
                "heart_rate_bpm": live_hr,
                "cardiac_rhythm": rhythm,
                "systolic_bp": live_sbp,
                "diastolic_bp": live_dbp,
                "mean_arterial_pressure_map": map_val,
                "respiratory_rate": live_rr,
                "spo2_percent": live_spo2,
                "oxygen_device": o2_flow,
                "temperature_celsius": live_temp,
                "consciousness": avpu
            },
            "news2_realtime": news2,
            "telemetry_alarms": {
                "is_critical_alarm": news2["risk_tier"] == "HIGH",
                "is_warning_alarm": news2["risk_tier"] == "MEDIUM",
                "alarm_text": news2["clinical_response"] if news2["risk_tier"] in ["HIGH", "MEDIUM"] else "Telemetry Normal"
            }
        }

    def get_live_hospital_activity_stream(self) -> List[Dict[str, Any]]:
        """
        Real-time hospital operations activity feed (Admissions, Ambulances, Discharges, Code alerts).
        """
        now = datetime.datetime.now(datetime.UTC)
        events = [
            {
                "id": "act-01",
                "time": (now - datetime.timedelta(minutes=2)).strftime("%H:%M:%S"),
                "dept": "Emergency Department",
                "type": "Ambulance Arrival",
                "message": "EMS Medic 14 inbound with 58yo male with acute ST-elevation (STEMI). Cath Lab pre-notified.",
                "urgency": "CRITICAL"
            },
            {
                "id": "act-02",
                "time": (now - datetime.timedelta(minutes=5)).strftime("%H:%M:%S"),
                "dept": "Intensive Care Unit (ICU)",
                "type": "Bed Transition",
                "message": "ICU Bed 04 step-down to Cardiology telemetry ward approved by Dr. Vance.",
                "urgency": "ROUTINE"
            },
            {
                "id": "act-03",
                "time": (now - datetime.timedelta(minutes=8)).strftime("%H:%M:%S"),
                "dept": "Blood Bank",
                "type": "Unit Transfusion",
                "message": "2 units Packed Red Blood Cells (PRBCs) O-Neg dispensed for Trauma Bay 1.",
                "urgency": "URGENT"
            },
            {
                "id": "act-04",
                "time": (now - datetime.timedelta(minutes=14)).strftime("%H:%M:%S"),
                "dept": "General Medicine",
                "type": "Discharge Completed",
                "message": "Bed 512-A discharged with e-prescriptions forwarded to retail pharmacy.",
                "urgency": "INFO"
            },
            {
                "id": "act-05",
                "time": (now - datetime.timedelta(minutes=21)).strftime("%H:%M:%S"),
                "dept": "Core Laboratory",
                "type": "Critical Lab Flag",
                "message": "Critical High Troponin I (0.84 ng/mL) reported for ED Bay 02. Attending paged.",
                "urgency": "CRITICAL"
            }
        ]
        return events

realtime_telemetry = RealTimeTelemetryEngine()
