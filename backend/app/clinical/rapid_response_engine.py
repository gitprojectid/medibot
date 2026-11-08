import datetime
import uuid
from typing import Dict, Any, List, Optional
from backend.app.hospital.synthetic_hospital import SYNTHETIC_PATIENTS

class RapidResponseEngine:
    """
    Rapid Response Team (RRT), Medical Emergency Team (MET) & Code Blue Dispatch Engine.
    Coordinates immediate bedside clinical resuscitation and time-critical protocol checklists.
    """

    ACTIVE_EMERGENCY_EVENTS = []

    EMERGENCY_PROTOCOLS = {
        "RAPID_RESPONSE_DETERIORATION": {
            "title": "Rapid Response Team (RRT) Activation",
            "trigger_criteria": "Acute deterioration: NEWS2 >= 5, acute drop in SpO2 < 90%, SBP < 90 or > 200, acute confusion, or nurse concern.",
            "team_dispatched": ["ICU Charge Nurse", "Respiratory Therapist", "Hospitalist Physician", "Clinical Pharmacist"],
            "checklist": [
                "1. Establish Airway, Breathing, Circulation (ABCs); apply high-flow oxygen if SpO2 < 92%.",
                "2. STAT 12-Lead ECG & bedside blood glucose check.",
                "3. Verify dual large-bore IV access (18G or 20G).",
                "4. Perform focused point-of-care ultrasound (POCUS) & arterial blood gas (ABG) if indicated.",
                "5. Decision: Initiate bedside stabilization vs immediate ICU transfer."
            ]
        },
        "CODE_BLUE_CARDIAC_ARREST": {
            "title": "Code Blue / Cardiac Arrest Resuscitation",
            "trigger_criteria": "Unresponsive patient, absent carotid pulse, or agonal breathing.",
            "team_dispatched": ["Code Team Leader (ICU Attending/Fellow)", "Anesthesiology/Airway Specialist", "Code Cart Nurse", "CPR Compressors (2x)", "Pharmacist"],
            "checklist": [
                "1. Start immediate high-quality chest compressions (100-120/min, depth 2-2.4 inches, allow full recoil).",
                "2. Attach defibrillator / monitor: identify rhythm (Shockable: VF/pVT vs Non-Shockable: PEA/Asystole).",
                "3. If shockable: Deliver 200J biphasic shock immediately, resume CPR x 2 mins.",
                "4. Administer Epinephrine 1 mg IV/IO every 3-5 minutes.",
                "5. Advanced airway placement (Endotracheal intubation with waveform capnography).",
                "6. Identify and treat reversible causes (5 H's and 5 T's)."
            ]
        },
        "CODE_SEPSIS_BUNDLE": {
            "title": "Code Sepsis Resuscitation Trigger",
            "trigger_criteria": "Suspected infection + 2 or more qSOFA points (RR >= 22, SBP <= 100, altered mentation).",
            "team_dispatched": ["Sepsis Nurse Navigator", "ED/ICU Resident", "Pharmacist"],
            "checklist": [
                "1. STAT Blood Cultures x2 sets before antibiotics.",
                "2. STAT Serum Lactate level (point-of-care or lab).",
                "3. Broad-spectrum empiric IV antibiotics within 60 minutes of recognition.",
                "4. IV Crystalloid bolus 30 mL/kg for hypotension (MAP < 65) or lactate >= 4 mmol/L.",
                "5. Vasopressors (Norepinephrine 1st line) if refractory to fluid bolus."
            ]
        }
    }

    def trigger_emergency_event(
        self,
        patient_id: str,
        event_type: str,
        caller_name: str,
        trigger_reason: str,
        bedside_location: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Trigger a live hospital-wide emergency dispatch event.
        """
        patient = next((p for p in SYNTHETIC_PATIENTS if p["id"] == patient_id), None)
        protocol = self.EMERGENCY_PROTOCOLS.get(event_type, self.EMERGENCY_PROTOCOLS["RAPID_RESPONSE_DETERIORATION"])

        event_id = f"evt-{str(uuid.uuid4())[:8]}"
        now_str = datetime.datetime.now(datetime.UTC).isoformat()

        event_record = {
            "id": event_id,
            "patient_id": patient_id,
            "patient_name": patient["full_name"] if patient else "Inpatient",
            "mrn": patient["mrn"] if patient else "MRN-UNKNOWN",
            "ward": patient["assigned_ward"] if patient else "General Ward",
            "room_bed": bedside_location or (patient["room_bed"] if patient else "Room Bed"),
            "event_type": event_type,
            "title": protocol["title"],
            "caller_name": caller_name,
            "trigger_reason": trigger_reason,
            "status": "DISPATCHED_ACTIVE", # DISPATCHED_ACTIVE, AT_BEDSIDE, STABILIZED, ICU_TRANSFERRED
            "team_dispatched": protocol["team_dispatched"],
            "checklist": protocol["checklist"],
            "dispatched_at": now_str,
            "resolved_at": None,
            "outcome_summary": None
        }

        self.ACTIVE_EMERGENCY_EVENTS.insert(0, event_record)

        if patient:
            patient.setdefault("timeline_events", []).insert(0, {
                "date": now_str[:10],
                "type": "Emergency",
                "title": f"🚨 {protocol['title']} Activated",
                "desc": f"Called by {caller_name}. Reason: {trigger_reason}. Resuscitation team dispatched."
            })

        return {
            "status": "success",
            "event": event_record,
            "broadcast_message": f"🚨 CODE ALERT: {protocol['title']} in {event_record['ward']} ({event_record['room_bed']}) for {event_record['patient_name']}. Resuscitation team dispatched."
        }

    def get_active_events(self) -> List[Dict[str, Any]]:
        return self.ACTIVE_EMERGENCY_EVENTS

    def resolve_emergency_event(
        self,
        event_id: str,
        resolved_by: str,
        outcome_status: str,
        outcome_notes: str
    ) -> Dict[str, Any]:
        """
        Record resolution and clinical disposition for an emergency event.
        """
        for ev in self.ACTIVE_EMERGENCY_EVENTS:
            if ev["id"] == event_id:
                ev["status"] = outcome_status
                ev["resolved_at"] = datetime.datetime.now(datetime.UTC).isoformat()
                ev["outcome_summary"] = f"Resolved by {resolved_by}: {outcome_notes}"
                return {"status": "success", "event": ev}
        return {"status": "error", "message": "Emergency event not found"}

rapid_response_engine = RapidResponseEngine()
