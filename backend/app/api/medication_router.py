from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from backend.app.medical.medications.medication_engine import medication_engine

router = APIRouter(prefix="/medications", tags=["Medication Safety & Pharmacology"])

class MedicationCheckRequest(BaseModel):
    medications: Optional[List[str]] = None
    current_medications: Optional[List[str]] = None
    new_medication_or_query: Optional[str] = ""
    conditions: Optional[List[str]] = None
    patient_conditions: Optional[List[str]] = None
    allergies: Optional[List[str]] = None
    patient_allergies: Optional[List[str]] = None
    is_pregnant: bool = False

# Comprehensive Clinical Drug Catalog
DRUG_CATALOG = [
    {
        "name": "Warfarin",
        "class": "Anticoagulant (Vitamin K Antagonist)",
        "indications": ["Atrial fibrillation", "Deep vein thrombosis (DVT)", "Pulmonary embolism (PE)", "Heart valve replacement"],
        "monitoring": "Target INR (2.0 - 3.0), Prothrombin time",
        "food_interactions": "Maintain consistent intake of Vitamin K-rich foods (spinach, kale, broccoli). Avoid cranberry juice and excessive alcohol.",
        "common_brands": ["Coumadin", "Jantoven"]
    },
    {
        "name": "Aspirin",
        "class": "Antiplatelet / NSAID (Salicylate)",
        "indications": ["Cardiovascular secondary prevention", "Acute coronary syndrome", "Analgesic / Anti-inflammatory"],
        "monitoring": "Signs of GI bleeding, black tarry stools, bruising",
        "food_interactions": "Take with food or milk to minimize gastric irritation.",
        "common_brands": ["Bayer", "Bufferin", "Ecotrin"]
    },
    {
        "name": "Lisinopril",
        "class": "ACE Inhibitor (Antihypertensive)",
        "indications": ["Hypertension", "Heart failure with reduced ejection fraction", "Post-myocardial infarction", "Diabetic nephropathy"],
        "monitoring": "Serum Potassium (K+), Serum Creatinine, Blood Pressure, dry cough",
        "food_interactions": "Avoid salt substitutes containing potassium chloride to prevent dangerous hyperkalemia.",
        "common_brands": ["Prinivil", "Zestril"]
    },
    {
        "name": "Spironolactone",
        "class": "Potassium-Sparing Diuretic / Aldosterone Antagonist",
        "indications": ["Heart failure", "Resistant hypertension", "Hyperaldosteronism", "Edema / Ascites"],
        "monitoring": "Serum Potassium, eGFR, gynecomastia",
        "food_interactions": "Avoid potassium supplements and high-potassium salt substitutes.",
        "common_brands": ["Aldactone", "CaroSpir"]
    },
    {
        "name": "Sertraline",
        "class": "SSRI Antidepressant",
        "indications": ["Major depressive disorder", "Generalized anxiety", "Obsessive-compulsive disorder (OCD)", "PTSD", "Panic disorder"],
        "monitoring": "Mood changes, signs of serotonin syndrome (clonus, tremor, hyperreflexia), QT prolongation",
        "food_interactions": "Avoid St. John's Wort and limit alcohol consumption.",
        "common_brands": ["Zoloft"]
    },
    {
        "name": "Tramadol",
        "class": "Atypical Opioid Analgesic / SNRI activity",
        "indications": ["Moderate to severe acute or chronic pain"],
        "monitoring": "Respiratory rate, sedation, serotonin syndrome risk, seizure threshold",
        "food_interactions": "Avoid alcohol and central nervous system depressants.",
        "common_brands": ["Ultram", "ConZip"]
    },
    {
        "name": "Metformin",
        "class": "Biguanide Antidiabetic",
        "indications": ["Type 2 Diabetes Mellitus", "Prediabetes", "Polycystic ovary syndrome (PCOS)"],
        "monitoring": "eGFR (hold if eGFR < 30 mL/min), Vitamin B12 levels, lactic acidosis signs",
        "food_interactions": "Take with meals to reduce gastrointestinal side effects. Avoid excessive alcohol.",
        "common_brands": ["Glucophage", "Fortamet"]
    },
    {
        "name": "Atorvastatin",
        "class": "HMG-CoA Reductase Inhibitor (Statin)",
        "indications": ["Hypercholesterolemia", "Cardiovascular event reduction", "Atherosclerosis"],
        "monitoring": "Lipid panel, Liver enzymes (ALT/AST), muscle pain / CK levels",
        "food_interactions": "Avoid large quantities of grapefruit juice (CYP3A4 inhibitor elevates statin levels).",
        "common_brands": ["Lipitor"]
    },
    {
        "name": "Amoxicillin",
        "class": "Aminopenicillin Antibiotic",
        "indications": ["Bacterial sinusitis", "Streptococcal pharyngitis", "Otitis media", "Pneumonia", "H. pylori eradication"],
        "monitoring": "Allergic rash, diarrhea, complete full prescribed course",
        "food_interactions": "May be taken with or without food.",
        "common_brands": ["Amoxil", "Moxatag"]
    },
    {
        "name": "Propranolol",
        "class": "Non-Cardioselective Beta-Blocker",
        "indications": ["Hypertension", "Angina", "Essential tremor", "Migraine prophylaxis", "Performance anxiety"],
        "monitoring": "Heart rate (hold if HR < 50 bpm), blood pressure, bronchospasm in asthmatic patients",
        "food_interactions": "Avoid abrupt discontinuation (risks rebound tachycardia and angina).",
        "common_brands": ["Inderal"]
    },
    {
        "name": "Ibuprofen",
        "class": "Nonsteroidal Anti-inflammatory Drug (NSAID)",
        "indications": ["Mild to moderate pain", "Fever reduction", "Osteoarthritis / Rheumatoid arthritis"],
        "monitoring": "Blood pressure, renal function, gastric discomfort, stool color",
        "food_interactions": "Take with food or milk to minimize GI irritation.",
        "common_brands": ["Advil", "Motrin"]
    },
    {
        "name": "Nitroglycerin",
        "class": "Nitrate Vasodilator",
        "indications": ["Acute angina pectoris relief", "Angina prophylaxis"],
        "monitoring": "Blood pressure (hypotension, dizziness), headache",
        "food_interactions": "Strictly contraindicated with PDE-5 inhibitors (Sildenafil/Viagra, Tadalafil/Cialis).",
        "common_brands": ["Nitrostat", "Nitrolingual"]
    },
    {
        "name": "Sildenafil",
        "class": "Phosphodiesterase-5 (PDE-5) Inhibitor",
        "indications": ["Erectile dysfunction", "Pulmonary arterial hypertension (Revatio)"],
        "monitoring": "Blood pressure, visual changes, priapism",
        "food_interactions": "Never take with nitrates. High-fat meals may delay onset of action.",
        "common_brands": ["Viagra", "Revatio"]
    },
    {
        "name": "Clopidogrel",
        "class": "P2Y12 Antiplatelet",
        "indications": ["Acute coronary syndrome", "Post-coronary stent", "Recent ischemic stroke", "Peripheral arterial disease"],
        "monitoring": "Bleeding, bruising, complete blood count",
        "food_interactions": "Avoid Omeprazole/Esomeprazole (inhibits CYP2C19 activation).",
        "common_brands": ["Plavix"]
    },
    {
        "name": "Digoxin",
        "class": "Cardiac Glycoside (Inotrope)",
        "indications": ["Atrial fibrillation rate control", "Heart failure with reduced ejection fraction"],
        "monitoring": "Serum Digoxin levels (0.5 - 0.9 ng/mL target), Serum Potassium, visual yellow-green halos",
        "food_interactions": "Avoid licorice (glycyrrhizin causes hypokalemia risking digoxin toxicity).",
        "common_brands": ["Lanoxin"]
    }
]

@router.post("/check")
async def check_medication_safety(req: MedicationCheckRequest):
    """
    Dedicated clinical pharmacology endpoint to check interactions, allergy conflicts, and contraindications.
    """
    # Merge flexible field names
    meds = req.medications if req.medications is not None else (req.current_medications or [])
    conds = req.conditions if req.conditions is not None else (req.patient_conditions or [])
    alls = req.allergies if req.allergies is not None else (req.patient_allergies or [])

    result = medication_engine.check_safety(
        current_medications=meds,
        new_medication_or_query=req.new_medication_or_query or "",
        patient_allergies=alls,
        patient_conditions=conds,
        is_pregnant=req.is_pregnant
    )

    # Food / Lifestyle Interaction Enhancements
    food_warnings = []
    meds_lower = [m.lower() for m in meds]
    if req.new_medication_or_query:
        meds_lower.append(req.new_medication_or_query.lower())

    for drug_info in DRUG_CATALOG:
        if any(drug_info["name"].lower() in m for m in meds_lower):
            food_warnings.append({
                "drug": drug_info["name"],
                "class": drug_info["class"],
                "food_interaction": drug_info["food_interactions"],
                "monitoring": drug_info["monitoring"]
            })

    result["food_interactions"] = food_warnings
    result["total_alerts_count"] = len(result.get("alerts", []))
    result["status"] = "CONFLICTS_DETECTED" if result.get("has_alerts") else "NO_CONFLICTS_FOUND"
    
    return result

@router.get("/database")
async def get_medication_database():
    """Retrieve full catalog of clinical medications, drug classes, and indications."""
    return {
        "catalog": DRUG_CATALOG,
        "total_drugs": len(DRUG_CATALOG)
    }

@router.get("/search")
async def search_medications(q: str = Query("", description="Medication name or drug class")):
    """Auto-complete search across clinical medication catalog."""
    query = q.lower().strip()
    if not query:
        return DRUG_CATALOG[:8]
    
    matches = [
        d for d in DRUG_CATALOG 
        if query in d["name"].lower() or query in d["class"].lower() or any(query in ind.lower() for ind in d["indications"])
    ]
    return matches
