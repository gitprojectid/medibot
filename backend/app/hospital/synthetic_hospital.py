import uuid
import datetime
from typing import List, Dict, Any, Optional

# Synthetic Multi-Department Hospital Architecture: Metro Health Academic Medical Center
METRO_HOSPITAL = {
    "id": "hosp-metro-001",
    "name": "Metro Health Academic Medical Center",
    "network": "Metro Health Healthcare System",
    "type": "Level 1 Trauma & Tertiary Academic Hospital",
    "address": "750 Medical Plaza Blvd, Metro City, NY 10021",
    "total_licensed_beds": 650,
    "departments": [
        {"id": "dept-ed", "name": "Emergency Department", "type": "Emergency", "beds": 60, "head": "Dr. Sarah Jenkins, MD, FACEP"},
        {"id": "dept-icu", "name": "Intensive Care Unit (ICU/CCU)", "type": "Critical Care", "beds": 45, "head": "Dr. Marcus Vance, MD, FCCM"},
        {"id": "dept-cardio", "name": "Cardiology & Cath Lab", "type": "Inpatient/Outpatient", "beds": 50, "head": "Dr. Eleanor Rivera, MD, FACC"},
        {"id": "dept-neuro", "name": "Neurology & Comprehensive Stroke Center", "type": "Inpatient/Outpatient", "beds": 40, "head": "Dr. David Kim, MD, FAAN"},
        {"id": "dept-pulm", "name": "Pulmonology & Respiratory Care", "type": "Inpatient", "beds": 35, "head": "Dr. Angela Brooks, MD, FCCP"},
        {"id": "dept-onco", "name": "Medical Oncology & Infusion", "type": "Inpatient/Outpatient", "beds": 45, "head": "Dr. Rajiv Patel, MD"},
        {"id": "dept-peds", "name": "Pediatrics & Neonatal ICU", "type": "Inpatient", "beds": 50, "head": "Dr. Emily Taylor, MD, FAAP"},
        {"id": "dept-genmed", "name": "General Internal Medicine", "type": "Inpatient", "beds": 120, "head": "Dr. Robert Chen, MD, FACP"},
        {"id": "dept-ortho", "name": "Orthopedic Surgery", "type": "Surgical", "beds": 40, "head": "Dr. Thomas Miller, MD, FAAOS"},
        {"id": "dept-obgyn", "name": "Obstetrics & Gynecology (Labor & Delivery)", "type": "Inpatient", "beds": 45, "head": "Dr. Maria Santos, MD, FACOG"},
        {"id": "dept-lab", "name": "Clinical Pathology & Core Laboratory", "type": "Diagnostic", "beds": 0, "head": "Dr. Kevin Zhang, MD, FCAP"},
        {"id": "dept-rad", "name": "Diagnostic & Interventional Radiology", "type": "Imaging", "beds": 0, "head": "Dr. Rachel Green, MD"}
    ]
}

# Longitudinal Synthetic Patient Profiles
SYNTHETIC_PATIENTS = [
    {
        "id": "pat-001",
        "mrn": "MRN-108291",
        "full_name": "James Arthur Miller",
        "age": 67,
        "gender": "Male",
        "dob": "1958-04-12",
        "blood_type": "O+",
        "assigned_ward": "dept-cardio",
        "room_bed": "Room 402-B",
        "attending_physician": "Dr. Eleanor Rivera, MD",
        "primary_nurse": "Nurse Sarah Connor, RN",
        "status": "Inpatient (Telemetry)",
        "admission_date": "2026-08-28T09:15:00Z",
        "chief_complaint": "Exertional dyspnea, orthopnea, and bilateral lower extremity 2+ pitting edema",
        "allergies": [
            {"allergen": "Penicillin", "reaction": "Anaphylaxis & Urticaria", "severity": "Severe"}
        ],
        "active_conditions": [
            {"code": "I50.22", "name": "Chronic Systolic Heart Failure (HFrEF, EF 30%)", "diagnosed": "2022-03"},
            {"code": "I10", "name": "Essential Hypertension (Stage 2)", "diagnosed": "2015-06"},
            {"code": "E11.9", "name": "Type 2 Diabetes Mellitus", "diagnosed": "2018-11"},
            {"code": "N18.3", "name": "Chronic Kidney Disease Stage 3a", "diagnosed": "2023-01"}
        ],
        "active_medications": [
            {"name": "Lisinopril", "dose": "20 mg", "route": "Oral", "freq": "Daily", "indication": "Heart Failure / HTN"},
            {"name": "Spironolactone", "dose": "25 mg", "route": "Oral", "freq": "Daily", "indication": "Aldosterone Antagonist"},
            {"name": "Furosemide", "dose": "40 mg", "route": "IV", "freq": "BID", "indication": "Acute Diuresis"},
            {"name": "Metoprolol Succinate", "dose": "50 mg", "route": "Oral", "freq": "Daily", "indication": "Beta-blocker"},
            {"name": "Empagliflozin", "dose": "10 mg", "route": "Oral", "freq": "Daily", "indication": "SGLT2 Inhibitor"}
        ],
        "vitals_time_series": [
            {"timestamp": "2026-08-30T06:00:00Z", "hr": 84, "sbp": 138, "dbp": 82, "rr": 20, "spo2": 95, "temp": 36.8, "o2_flow": "2L Nasal Cannula", "avpu": "Alert", "news2_score": 3},
            {"timestamp": "2026-08-30T10:00:00Z", "hr": 88, "sbp": 142, "dbp": 86, "rr": 22, "spo2": 94, "temp": 37.0, "o2_flow": "2L Nasal Cannula", "avpu": "Alert", "news2_score": 4},
            {"timestamp": "2026-08-30T12:00:00Z", "hr": 92, "sbp": 146, "dbp": 88, "rr": 23, "spo2": 93, "temp": 37.2, "o2_flow": "2L Nasal Cannula", "avpu": "Alert", "news2_score": 5}
        ],
        "recent_labs": [
            {"test": "NT-proBNP", "value": "4,250", "unit": "pg/mL", "ref": "< 450", "status": "Critical High", "date": "2026-08-30T08:00:00Z"},
            {"test": "Serum Potassium (K+)", "value": "5.1", "unit": "mEq/L", "ref": "3.5 - 5.0", "status": "Borderline High", "date": "2026-08-30T08:00:00Z"},
            {"test": "Serum Creatinine", "value": "1.6", "unit": "mg/dL", "ref": "0.7 - 1.3", "status": "High", "date": "2026-08-30T08:00:00Z"},
            {"test": "eGFR", "value": "44", "unit": "mL/min/1.73m2", "ref": "> 60", "status": "Low", "date": "2026-08-30T08:00:00Z"},
            {"test": "HbA1c", "value": "7.2", "unit": "%", "ref": "< 5.7", "status": "High", "date": "2026-08-28T10:00:00Z"}
        ],
        "timeline_events": [
            {"date": "2026-08-28", "type": "Admission", "title": "Acute Decompensated Heart Failure Admission", "desc": "Admitted through ED with respiratory distress and fluid overload. Placed on IV Lasix protocol."},
            {"date": "2026-08-29", "type": "Diagnostic", "title": "Echocardiogram Complete", "desc": "LVEF 30%, severe left ventricular dilation, grade II diastolic dysfunction."},
            {"date": "2026-08-30", "type": "Clinical Review", "title": "Cardiology Rounding Note", "desc": "Urine output 1.8L overnight. Net fluid balance -1.2L. Continue diuresis, monitor potassium."}
        ]
    },
    {
        "id": "pat-002",
        "mrn": "MRN-204518",
        "full_name": "Elena Sofia Vasquez",
        "age": 42,
        "gender": "Female",
        "dob": "1984-09-23",
        "blood_type": "A-",
        "assigned_ward": "dept-ed",
        "room_bed": "ED Bay 04",
        "attending_physician": "Dr. Sarah Jenkins, MD",
        "primary_nurse": "Nurse David Ortiz, RN",
        "status": "Under Evaluation (Emergency)",
        "admission_date": "2026-08-30T10:45:00Z",
        "chief_complaint": "Sudden onset right lower quadrant abdominal pain, anorexia, nausea, fever 38.6°C",
        "allergies": [
            {"allergen": "Sulfa Antibiotics", "reaction": "Maculopapular Rash", "severity": "Moderate"}
        ],
        "active_conditions": [
            {"code": "K35.80", "name": "Acute Appendicitis (Suspected / Alvarado Score 8)", "diagnosed": "2026-08-30"}
        ],
        "active_medications": [
            {"name": "Acetaminophen", "dose": "1000 mg", "route": "IV", "freq": "Q6H PRN", "indication": "Analgesia"},
            {"name": "Ondansetron", "dose": "4 mg", "route": "IV", "freq": "Q8H PRN", "indication": "Nausea"}
        ],
        "vitals_time_series": [
            {"timestamp": "2026-08-30T11:00:00Z", "hr": 104, "sbp": 118, "dbp": 74, "rr": 20, "spo2": 99, "temp": 38.6, "o2_flow": "Room Air", "avpu": "Alert", "news2_score": 4}
        ],
        "recent_labs": [
            {"test": "White Blood Cell (WBC)", "value": "16.8", "unit": "x10^3/uL", "ref": "4.5 - 11.0", "status": "Critical High (Leukocytosis)", "date": "2026-08-30T11:15:00Z"},
            {"test": "Neutrophil %", "value": "84", "unit": "%", "ref": "40 - 70", "status": "High (Left Shift)", "date": "2026-08-30T11:15:00Z"},
            {"test": "C-Reactive Protein (CRP)", "value": "48.2", "unit": "mg/L", "ref": "< 5.0", "status": "High", "date": "2026-08-30T11:15:00Z"},
            {"test": "Urine HCG (Pregnancy)", "value": "Negative", "unit": "Qual", "ref": "Negative", "status": "Normal", "date": "2026-08-30T11:00:00Z"}
        ],
        "timeline_events": [
            {"date": "2026-08-30", "type": "Emergency", "title": "Emergency Department Triage", "desc": "Arrived with acute McBurney point tenderness, positive Rovsing sign. Alvarado score 8/10."},
            {"date": "2026-08-30", "type": "Order", "title": "Abdominal/Pelvic CT with IV Contrast Ordered", "desc": "Urgent surgical imaging pending."}
        ]
    },
    {
        "id": "pat-003",
        "mrn": "MRN-339102",
        "full_name": "Marcus Aurelius Thorne",
        "age": 74,
        "gender": "Male",
        "dob": "1951-11-03",
        "blood_type": "A+",
        "assigned_ward": "dept-icu",
        "room_bed": "ICU Bed 07",
        "attending_physician": "Dr. Marcus Vance, MD",
        "primary_nurse": "Nurse Jessica Alba, RN, CCRN",
        "status": "Critical (ICU Sepsis Protocol)",
        "admission_date": "2026-08-29T18:30:00Z",
        "chief_complaint": "Severe sepsis secondary to community-acquired pneumonia; hypotension and altered mental status",
        "allergies": [],
        "active_conditions": [
            {"code": "A41.9", "name": "Severe Sepsis (qSOFA Score 2)", "diagnosed": "2026-08-29"},
            {"code": "J18.9", "name": "Right Middle Lobe Bacterial Pneumonia", "diagnosed": "2026-08-29"},
            {"code": "J44.1", "name": "Chronic Obstructive Pulmonary Disease (COPD)", "diagnosed": "2016-04"}
        ],
        "active_medications": [
            {"name": "Ceftriaxone", "dose": "2 g", "route": "IV", "freq": "Daily", "indication": "Broad-spectrum Antibiotic"},
            {"name": "Azithromycin", "dose": "500 mg", "route": "IV", "freq": "Daily", "indication": "Atypical Coverage"},
            {"name": "Norepinephrine", "dose": "0.08 mcg/kg/min", "route": "IV Infusion", "freq": "Continuous", "indication": "Vasopressor MAP > 65"},
            {"name": "Normal Saline 0.9%", "dose": "30 mL/kg bolus", "route": "IV", "freq": "Completed", "indication": "Volume Resuscitation"}
        ],
        "vitals_time_series": [
            {"timestamp": "2026-08-30T08:00:00Z", "hr": 112, "sbp": 86, "dbp": 52, "rr": 26, "spo2": 91, "temp": 39.1, "o2_flow": "4L High Flow", "avpu": "Voice (Confused)", "news2_score": 11},
            {"timestamp": "2026-08-30T10:00:00Z", "hr": 106, "sbp": 94, "dbp": 58, "rr": 24, "spo2": 93, "temp": 38.7, "o2_flow": "4L High Flow", "avpu": "Voice", "news2_score": 9},
            {"timestamp": "2026-08-30T12:00:00Z", "hr": 98, "sbp": 102, "dbp": 62, "rr": 22, "spo2": 94, "temp": 38.2, "o2_flow": "3L Nasal Cannula", "avpu": "Alert", "news2_score": 6}
        ],
        "recent_labs": [
            {"test": "Serum Lactate", "value": "3.8", "unit": "mmol/L", "ref": "0.5 - 2.0", "status": "Critical High", "date": "2026-08-30T08:00:00Z"},
            {"test": "Serum Lactate (Repeat 4h)", "value": "2.1", "unit": "mmol/L", "ref": "0.5 - 2.0", "status": "Improving", "date": "2026-08-30T12:00:00Z"},
            {"test": "Procalcitonin", "value": "8.4", "unit": "ng/mL", "ref": "< 0.1", "status": "Critical High", "date": "2026-08-29T19:00:00Z"},
            {"test": "Blood Culture", "value": "Gram-positive diplococci (Pending Speciation)", "unit": "Microbiology", "ref": "No Growth", "status": "Positive", "date": "2026-08-29T19:00:00Z"}
        ],
        "timeline_events": [
            {"date": "2026-08-29", "type": "Critical Care", "title": "ICU Sepsis Resuscitation Bundle Initiated", "desc": "IV broad spectrum antibiotics initiated within 45 min of arrival. Lactate clearance protocol active."},
            {"date": "2026-08-30", "type": "Weaning", "title": "Vasopressor Down-titration", "desc": "MAP stabilized > 68 mmHg. Levophed infusion reduced from 0.12 to 0.08 mcg/kg/min."}
        ]
    },
    {
        "id": "pat-004",
        "mrn": "MRN-441920",
        "full_name": "Amina Zainab Al-Mansoor",
        "age": 29,
        "gender": "Female",
        "dob": "1997-02-14",
        "blood_type": "B+",
        "assigned_ward": "dept-obgyn",
        "room_bed": "L&D Suite 3",
        "attending_physician": "Dr. Maria Santos, MD",
        "primary_nurse": "Nurse Chloe Bennett, RN, RNC-OB",
        "status": "Inpatient (Antepartum High Risk)",
        "admission_date": "2026-08-30T07:00:00Z",
        "chief_complaint": "Gestational age 34 weeks, severe persistent frontal headache, visual scotomata, BP 168/104 mmHg",
        "allergies": [
            {"allergen": "Aspirin / NSAIDs", "reaction": "Bronchospasm & Facial Angioedema", "severity": "Severe"}
        ],
        "active_conditions": [
            {"code": "O14.13", "name": "Severe Preeclampsia in 3rd Trimester", "diagnosed": "2026-08-30"},
            {"code": "O24.419", "name": "Gestational Diabetes (Diet Controlled)", "diagnosed": "2026-06-10"}
        ],
        "active_medications": [
            {"name": "Magnesium Sulfate", "dose": "4g IV load, then 2g/hr", "route": "IV Infusion", "freq": "Continuous", "indication": "Eclampsia Seizure Prophylaxis"},
            {"name": "Labetalol", "dose": "20 mg", "route": "IV Push", "freq": "Q10 min PRN SBP>160", "indication": "Acute Antihypertensive"}
        ],
        "vitals_time_series": [
            {"timestamp": "2026-08-30T07:30:00Z", "hr": 88, "sbp": 168, "dbp": 104, "rr": 18, "spo2": 98, "temp": 36.9, "o2_flow": "Room Air", "avpu": "Alert", "news2_score": 4},
            {"timestamp": "2026-08-30T09:00:00Z", "hr": 82, "sbp": 146, "dbp": 92, "rr": 16, "spo2": 99, "temp": 36.8, "o2_flow": "Room Air", "avpu": "Alert", "news2_score": 1}
        ],
        "recent_labs": [
            {"test": "Urine Protein/Creatinine Ratio", "value": "0.85", "unit": "mg/mg", "ref": "< 0.30", "status": "High (Severe Proteinuria)", "date": "2026-08-30T08:00:00Z"},
            {"test": "Platelet Count", "value": "115", "unit": "x10^3/uL", "ref": "150 - 450", "status": "Low (Thrombocytopenia Watch)", "date": "2026-08-30T08:00:00Z"},
            {"test": "AST (SGOT)", "value": "78", "unit": "U/L", "ref": "10 - 40", "status": "Elevated (HELLP screening)", "date": "2026-08-30T08:00:00Z"},
            {"test": "ALT (SGPT)", "value": "82", "unit": "U/L", "ref": "7 - 56", "status": "Elevated", "date": "2026-08-30T08:00:00Z"}
        ],
        "timeline_events": [
            {"date": "2026-08-30", "type": "Obstetric High Risk", "title": "Severe Preeclampsia Protocol Activated", "desc": "Magnesium sulfate seizure prophylaxis running. Maternal-Fetal Medicine (MFM) and NICU teams notified."}
        ]
    }
]

def get_hospital_overview() -> Dict[str, Any]:
    """Retrieve multi-department operational overview."""
    total_beds = METRO_HOSPITAL["total_licensed_beds"]
    occupied_beds = sum(d["beds"] for d in METRO_HOSPITAL["departments"]) - 78
    return {
        "hospital": METRO_HOSPITAL,
        "census": {
            "total_beds": total_beds,
            "occupied_beds": occupied_beds,
            "available_beds": total_beds - occupied_beds,
            "occupancy_rate_pct": round((occupied_beds / total_beds) * 100, 1),
            "icu_occupancy_pct": 88.9,
            "ed_active_patients": 42,
            "ed_average_wait_minutes": 24,
            "admissions_last_24h": 68,
            "discharges_planned_today": 54
        }
    }
