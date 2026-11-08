import datetime
import uuid
from typing import Dict, Any, List, Optional
from backend.app.hospital.synthetic_hospital import SYNTHETIC_PATIENTS

class ClinicalOrdersEngine:
    """
    Computerized Physician Order Entry (CPOE) & Rapid Clinical Order Sets Engine.
    Enables 1-click execution of guideline-recommended inpatient order bundles.
    """

    ACTIVE_PATIENT_ORDERS = []

    ORDER_BUNDLES = [
        {
            "id": "bundle-sepsis-01",
            "name": "Surviving Sepsis 1-Hour Resuscitation Bundle",
            "clinical_guideline": "Surviving Sepsis Campaign 2024 / CDC Core Sepsis Measures",
            "indication": "Suspected Sepsis / Septic Shock (qSOFA >= 2 or NEWS2 >= 5)",
            "urgency": "STAT (Within 60 Minutes)",
            "orders": [
                {"type": "Laboratory", "name": "Serum Lactate Level STAT", "details": "Assess for tissue hypoperfusion (> 2.0 mmol/L requires repeat in 2h)"},
                {"type": "Microbiology", "name": "Blood Cultures x2 Sets (Aerobic & Anaerobic)", "details": "Draw prior to initiation of broad-spectrum antimicrobials"},
                {"type": "Medication", "name": "Ceftriaxone 2g IV piggyback", "details": "Empiric broad-spectrum coverage, infuse over 30 mins"},
                {"type": "Medication", "name": "Vancomycin 1.5g IV piggyback", "details": "Target trough 15-20 mcg/mL, infuse over 90 mins"},
                {"type": "IV Fluids", "name": "Lactated Ringer's IV Fluid 30 mL/kg Bolus", "details": "Initiate immediately for hypotension (MAP < 65) or lactate >= 4"},
                {"type": "Nursing", "name": "Strict Intake/Output & Vitals q1h", "details": "Monitor urine output (> 0.5 mL/kg/h target), repeat lactate in 2-4h"}
            ]
        },
        {
            "id": "bundle-acs-02",
            "name": "Acute Coronary Syndrome (ACS) / Chest Pain Protocol",
            "clinical_guideline": "AHA/ACC Non-ST-Elevation ACS Guidelines",
            "indication": "Acute chest pain, suspected myocardial ischemia or infarction",
            "urgency": "STAT",
            "orders": [
                {"type": "Diagnostic", "name": "STAT 12-Lead Electrocardiogram (ECG)", "details": "Perform and interpret within 10 minutes of arrival"},
                {"type": "Laboratory", "name": "Serial High-Sensitivity Troponin I (0h, 2h, 6h)", "details": "Evaluate delta rise/fall for myocardial injury"},
                {"type": "Medication", "name": "Aspirin 325 mg PO Chewable STAT", "details": "Antiplatelet loading dose, non-enteric coated"},
                {"type": "Medication", "name": "Nitroglycerin 0.4 mg SL PRN chest pain q5m x 3", "details": "Hold if SBP < 90 mmHg or phosphodiesterase inhibitor use"},
                {"type": "Medication", "name": "Heparin Sodium IV 60 units/kg bolus + 12 units/kg/h", "details": "Titrate per hospital weight-based ACS heparin nomogram"},
                {"type": "Nursing", "name": "Continuous Cardiac Telemetry & Pulse Oximetry", "details": "Titrate supplemental O2 to keep SpO2 >= 90%"}
            ]
        },
        {
            "id": "bundle-hf-03",
            "name": "Acute Decompensated Heart Failure (ADHF) Diuresis Protocol",
            "clinical_guideline": "2023 ACC/AHA/HFSA Heart Failure Guidelines",
            "indication": "Acute pulmonary congestion, volume overload, peripheral edema",
            "urgency": "URGENT",
            "orders": [
                {"type": "Medication", "name": "Furosemide (Lasix) 40 mg IV Push BID", "details": "Titrate dose to achieve 1-2 Liters net negative fluid balance/24h"},
                {"type": "Diet", "name": "Cardiac Low-Sodium Diet (2,000 mg/day)", "details": "Fluid restriction 1.5 - 2.0 Liters/day"},
                {"type": "Laboratory", "name": "Basic Metabolic Panel (BMP) Daily in AM", "details": "Monitor serum Potassium, Sodium, BUN, and Creatinine"},
                {"type": "Nursing", "name": "Daily Weights Standing in AM after first void", "details": "Notify physician if weight gain > 2 lbs in 24h or > 5 lbs in 1 week"},
                {"type": "Nursing", "name": "Strict Intake and Output (I/O) Recording", "details": "Record every 4 hours with cumulative shift balance"}
            ]
        },
        {
            "id": "bundle-copd-04",
            "name": "COPD / Asthma Acute Exacerbation Protocol",
            "clinical_guideline": "GOLD 2024 Global Strategy for COPD",
            "indication": "Acute bronchospasm, dyspnea, increased sputum volume/purulence",
            "urgency": "URGENT",
            "orders": [
                {"type": "Respiratory", "name": "Albuterol 2.5mg / Ipratropium 0.5mg (DuoNeb) Nebulizer q4h", "details": "Inhaled bronchodilator therapy PRN wheezing"},
                {"type": "Medication", "name": "Prednisone 40 mg PO Daily x 5 Days", "details": "Systemic corticosteroid anti-inflammatory therapy"},
                {"type": "Medication", "name": "Azithromycin 500 mg PO Day 1 then 250 mg Daily x 4", "details": "Empiric antimicrobial coverage for purulent sputum"},
                {"type": "Respiratory", "name": "Titrated Supplemental Oxygen (Venturi Mask)", "details": "Target SpO2 88% - 92% to avoid hypercapnic respiratory depression"}
            ]
        },
        {
            "id": "bundle-postop-05",
            "name": "Post-Operative General Surgical Recovery & DVT Prophylaxis",
            "clinical_guideline": "ERAS (Enhanced Recovery After Surgery) Standards",
            "indication": "Postoperative recovery, surgical ward admission",
            "urgency": "ROUTINE",
            "orders": [
                {"type": "Nursing", "name": "Bedside Vitals q2h x 4, then q4h if stable", "details": "Monitor for early postoperative bleeding or hypothermia"},
                {"type": "Medication", "name": "Enoxaparin (Lovenox) 40 mg SubQ Daily", "details": "Pharmacologic DVT/VTE prophylaxis (hold if active bleeding)"},
                {"type": "Respiratory", "name": "Incentive Spirometry 10 Breaths/Hour while awake", "details": "Atelectasis prevention and lung recruitment"},
                {"type": "Diet", "name": "Clear Liquid Diet advance to Regular as tolerated", "details": "Advance diet once bowel sounds present and flatus passed"}
            ]
        }
    ]

    def get_order_bundles(self) -> List[Dict[str, Any]]:
        return self.ORDER_BUNDLES

    def execute_bundle_orders(
        self,
        bundle_id: str,
        patient_id: str,
        ordering_physician: str
    ) -> Dict[str, Any]:
        """
        Execute an entire clinical order set in 1 click, placing real active orders for nursing & pharmacy.
        """
        patient = next((p for p in SYNTHETIC_PATIENTS if p["id"] == patient_id), None)
        if not patient:
            return {"error": "Patient not found"}

        bundle = next((b for b in self.ORDER_BUNDLES if b["id"] == bundle_id), None)
        if not bundle:
            return {"error": "Bundle not found"}

        now_str = datetime.datetime.now(datetime.UTC).isoformat()
        created_orders = []

        for item in bundle["orders"]:
            order_id = f"ord-{str(uuid.uuid4())[:8]}"
            order_obj = {
                "id": order_id,
                "bundle_id": bundle["id"],
                "bundle_name": bundle["name"],
                "patient_id": patient_id,
                "patient_name": patient["full_name"],
                "patient_mrn": patient["mrn"],
                "ward": patient["assigned_ward"],
                "room_bed": patient["room_bed"],
                "order_type": item["type"],
                "order_name": item["name"],
                "clinical_details": item["details"],
                "ordering_physician": ordering_physician,
                "status": "ORDERED_ACTIVE", # ORDERED_ACTIVE, IN_PROGRESS, COMPLETED
                "created_at": now_str,
                "completed_at": None,
                "completed_by": None
            }
            self.ACTIVE_PATIENT_ORDERS.insert(0, order_obj)
            created_orders.append(order_obj)

        # Add to patient timeline
        patient.setdefault("timeline_events", []).insert(0, {
            "date": now_str[:10],
            "type": "CPOE Order",
            "title": f"CPOE Bundle Executed: {bundle['name']}",
            "desc": f"Ordered by {ordering_physician} ({len(bundle['orders'])} items). Guideline: {bundle['clinical_guideline']}."
        })

        return {
            "status": "success",
            "bundle_name": bundle["name"],
            "orders_count": len(created_orders),
            "orders": created_orders
        }

    def get_orders_for_patient(self, patient_id: str) -> List[Dict[str, Any]]:
        return [o for o in self.ACTIVE_PATIENT_ORDERS if o["patient_id"] == patient_id]

    def get_all_active_orders(self) -> List[Dict[str, Any]]:
        return self.ACTIVE_PATIENT_ORDERS

    def complete_order(self, order_id: str, completed_by: str) -> Dict[str, Any]:
        for o in self.ACTIVE_PATIENT_ORDERS:
            if o["id"] == order_id:
                o["status"] = "COMPLETED"
                o["completed_at"] = datetime.datetime.now(datetime.UTC).isoformat()
                o["completed_by"] = completed_by
                return {"status": "success", "order": o}
        return {"status": "error", "message": "Order not found"}

orders_engine = ClinicalOrdersEngine()
