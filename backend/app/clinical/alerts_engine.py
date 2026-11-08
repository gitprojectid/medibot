import datetime
import uuid
from typing import Dict, Any, List
from backend.app.hospital.synthetic_hospital import SYNTHETIC_PATIENTS
from backend.app.clinical.monitoring_engine import monitoring_engine

class ClinicalAlertsEngine:
    """
    Hospital-Wide Real-Time Clinical Alerts & Escalation Dispatch Engine.
    Detects critical patient deteriorations, severe lab anomalies, and provides 1-click clinical actions.
    """

    ACKNOWLEDGED_ALERTS = {}

    def get_active_hospital_alerts(self) -> List[Dict[str, Any]]:
        """
        Scan all active inpatients in real time for critical early warning triggers.
        """
        alerts = []
        now_str = datetime.datetime.now(datetime.UTC).isoformat()

        for p in SYNTHETIC_PATIENTS:
            patient_id = p["id"]
            latest_vitals = p["vitals_time_series"][-1] if p.get("vitals_time_series") else None
            
            if latest_vitals:
                # 1. NEWS2 Early Warning Score Check
                news2 = monitoring_engine.calculate_news2(
                    rr=latest_vitals.get("rr", 18),
                    spo2=latest_vitals.get("spo2", 98),
                    is_on_supplemental_o2="Nasal" in latest_vitals.get("o2_flow", "") or "High" in latest_vitals.get("o2_flow", ""),
                    sbp=latest_vitals.get("sbp", 120),
                    hr=latest_vitals.get("hr", 75),
                    consciousness=latest_vitals.get("avpu", "Alert"),
                    temp=latest_vitals.get("temp", 37.0)
                )

                if news2["total_score"] >= 5:
                    alert_id = f"alt-news2-{patient_id}"
                    ack_info = self.ACKNOWLEDGED_ALERTS.get(alert_id)
                    alerts.append({
                        "id": alert_id,
                        "patient_id": patient_id,
                        "patient_name": p["full_name"],
                        "mrn": p["mrn"],
                        "ward": p["assigned_ward"],
                        "room_bed": p["room_bed"],
                        "alert_type": "PHYSIOLOGICAL_DETERIORATION",
                        "severity": "CRITICAL" if news2["total_score"] >= 7 else "URGENT",
                        "title": f"High NEWS2 Score ({news2['total_score']}/20) - {news2['risk_tier']} Risk",
                        "description": f"HR: {latest_vitals.get('hr')} bpm, BP: {latest_vitals.get('sbp')}/{latest_vitals.get('dbp')}, SpO2: {latest_vitals.get('spo2')}%, RR: {latest_vitals.get('rr')}/min.",
                        "recommended_action": news2["clinical_response"],
                        "is_acknowledged": bool(ack_info),
                        "acknowledged_by": ack_info.get("acknowledged_by") if ack_info else None,
                        "acknowledged_at": ack_info.get("timestamp") if ack_info else None,
                        "timestamp": now_str
                    })

            # 2. Critical Lab Values Check
            for lab in p.get("recent_labs", []):
                status_str = str(lab.get("status", ""))
                if "Critical" in status_str or "High" in status_str:
                    alert_id = f"alt-lab-{patient_id}-{lab['test'].replace(' ', '_')}"
                    ack_info = self.ACKNOWLEDGED_ALERTS.get(alert_id)
                    alerts.append({
                        "id": alert_id,
                        "patient_id": patient_id,
                        "patient_name": p["full_name"],
                        "mrn": p["mrn"],
                        "ward": p["assigned_ward"],
                        "room_bed": p["room_bed"],
                        "alert_type": "CRITICAL_LAB_VALUE",
                        "severity": "CRITICAL" if "Critical" in status_str else "URGENT",
                        "title": f"Abnormal Lab: {lab['test']} = {lab['value']} {lab['unit']}",
                        "description": f"Reference range: {lab['ref']}. Result flagged as {lab['status']}.",
                        "recommended_action": f"Review {lab['test']} telemetry and adjust clinical therapy immediately.",
                        "is_acknowledged": bool(ack_info),
                        "acknowledged_by": ack_info.get("acknowledged_by") if ack_info else None,
                        "acknowledged_at": ack_info.get("timestamp") if ack_info else None,
                        "timestamp": now_str
                    })

        # Sort by unacknowledged first, then severity
        alerts.sort(key=lambda x: (x["is_acknowledged"], x["severity"] != "CRITICAL"))
        return alerts

    def acknowledge_alert(self, alert_id: str, clinician_name: str, action_taken: Optional[str] = None) -> Dict[str, Any]:
        """
        Record 1-click clinical acknowledgment with timestamp and action notes.
        """
        ack_data = {
            "alert_id": alert_id,
            "acknowledged_by": clinician_name,
            "action_taken": action_taken or "Reviewed and verified at bedside",
            "timestamp": datetime.datetime.now(datetime.UTC).isoformat()
        }
        self.ACKNOWLEDGED_ALERTS[alert_id] = ack_data
        return {"status": "success", "acknowledgement": ack_data}

alerts_engine = ClinicalAlertsEngine()
