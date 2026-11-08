import re
from typing import List, Dict, Any, Optional

class MedicationSafetyEngine:
    """
    Deterministic Clinical Pharmacology & Toxicology Engine.
    Evaluates multi-drug interaction matrices, allergen cross-reactivities,
    disease-drug contraindications, and obstetric teratogenicity risks.
    """

    KNOWN_INTERACTIONS = [
        {
            "drug_a": "warfarin",
            "drug_b": "aspirin",
            "severity": "major",
            "effect": "Significantly increases bleeding risk, platelet inhibition, and severe gastrointestinal hemorrhage.",
            "recommendation": "Avoid concurrent use unless strictly supervised by a cardiologist with regular INR monitoring."
        },
        {
            "drug_a": "warfarin",
            "drug_b": "ibuprofen",
            "severity": "major",
            "effect": "NSAIDs damage GI mucosa and inhibit platelet aggregation, greatly elevating hemorrhage risk with Warfarin.",
            "recommendation": "Avoid NSAIDs with Warfarin; consider non-interacting analgesics like Acetaminophen (with liver monitoring)."
        },
        {
            "drug_a": "lisinopril",
            "drug_b": "spironolactone",
            "severity": "major",
            "effect": "Combined use of ACE inhibitors and potassium-sparing diuretics significantly increases the risk of severe Hyperkalemia (dangerously high blood potassium and cardiac arrhythmias).",
            "recommendation": "Requires routine monitoring of serum potassium and renal function (eGFR/Creatinine)."
        },
        {
            "drug_a": "sertraline",
            "drug_b": "tramadol",
            "severity": "major",
            "effect": "Dual serotonergic stimulation risks Serotonin Syndrome (hyperthermia, neuromuscular clonus, severe autonomic instability, seizures).",
            "recommendation": "Avoid co-administration or monitor closely for early symptoms of serotonergic toxicity."
        },
        {
            "drug_a": "sildenafil",
            "drug_b": "nitroglycerin",
            "severity": "contraindicated",
            "effect": "Severe, synergistic vasodilation causing profound, refractory, and potentially fatal hypotension and cardiovascular collapse.",
            "recommendation": "Strict absolute contraindication. Co-administration is strictly prohibited."
        },
        {
            "drug_a": "digoxin",
            "drug_b": "amiodarone",
            "severity": "major",
            "effect": "Amiodarone reduces renal and non-renal clearance of Digoxin, doubling serum digoxin levels and risking fatal arrhythmias and heart block.",
            "recommendation": "Reduce Digoxin dose by 50% upon initiating Amiodarone and check therapeutic drug levels."
        },
        {
            "drug_a": "lithium",
            "drug_b": "ibuprofen",
            "severity": "major",
            "effect": "NSAIDs decrease renal lithium excretion, causing toxic lithium accumulation (tremors, ataxia, renal failure).",
            "recommendation": "Avoid NSAIDs in patients on Lithium therapy; use alternative analgesics."
        },
        {
            "drug_a": "clopidogrel",
            "drug_b": "omeprazole",
            "severity": "major",
            "effect": "Omeprazole competitively inhibits CYP2C19, reducing the metabolic activation of Clopidogrel and increasing stent thrombosis risk.",
            "recommendation": "Consider Pantoprazole or H2-receptor antagonists which have minimal CYP2C19 inhibition."
        },
        {
            "drug_a": "ciprofloxacin",
            "drug_b": "theophylline",
            "severity": "major",
            "effect": "Ciprofloxacin inhibits theophylline metabolism leading to theophylline toxicity, tachycardia, and seizures.",
            "recommendation": "Dose reduction of theophylline and therapeutic drug monitoring required."
        },
        {
            "drug_a": "metformin",
            "drug_b": "iodinated contrast",
            "severity": "major",
            "effect": "Risk of acute renal impairment leading to toxic Metformin accumulation and fatal Lactic Acidosis.",
            "recommendation": "Withhold Metformin 48 hours prior to and after contrast imaging until normal renal function is confirmed."
        },
        {
            "drug_a": "simvastatin",
            "drug_b": "clarithromycin",
            "severity": "major",
            "effect": "Strong CYP3A4 inhibition elevates statin plasma concentrations, risking acute Rhabdomyolysis and renal tubular necrosis.",
            "recommendation": "Temporarily suspend Statin therapy during Macrolide antibiotic course."
        },
        {
            "drug_a": "methotrexate",
            "drug_b": "aspirin",
            "severity": "major",
            "effect": "Salicylates decrease renal tubular excretion of Methotrexate, increasing bone marrow suppression and hepatotoxicity.",
            "recommendation": "Avoid concurrent high-dose salicylates with Methotrexate."
        }
    ]

    ALLERGY_CROSS_REACTIVITY = [
        {
            "allergen": "penicillin",
            "cross_reactive_drugs": ["amoxicillin", "ampicillin", "augmentin", "piperacillin", "cephalexin", "cefazolin", "penicillin"],
            "severity": "high",
            "warning": "Cross-reactivity between Penicillins and 1st-generation Cephalosporins (shared beta-lactam ring structure) risks anaphylaxis."
        },
        {
            "allergen": "sulfa",
            "cross_reactive_drugs": ["sulfamethoxazole", "bactrim", "septra", "sulfasalazine"],
            "severity": "high",
            "warning": "High risk of severe cutaneous adverse reactions (SCAR / Stevens-Johnson Syndrome) with sulfonamide antibiotics."
        },
        {
            "allergen": "aspirin",
            "cross_reactive_drugs": ["ibuprofen", "naproxen", "ketorolac", "indomethacin", "meloxicam", "celecoxib", "aspirin"],
            "severity": "high",
            "warning": "Cross-reactivity across all COX-inhibiting NSAIDs risks acute bronchospasm and facial angioedema (Samter's Triad)."
        }
    ]

    CONDITION_CONTRAINDICATIONS = [
        {
            "condition": "asthma",
            "contraindicated_drugs": ["propranolol", "timolol", "atenolol", "metoprolol", "aspirin", "ibuprofen", "naproxen"],
            "severity": "high",
            "reason": "Beta-blockers can trigger acute life-threatening bronchoconstriction and status asthmaticus by blocking beta-2 airway receptors."
        },
        {
            "condition": "peptic ulcer",
            "contraindicated_drugs": ["aspirin", "ibuprofen", "naproxen", "ketorolac", "indomethacin", "prednisone", "dexamethasone"],
            "severity": "high",
            "reason": "NSAIDs and Systemic Corticosteroids inhibit protective gastrointestinal prostaglandins, risking ulcer perforation and massive GI bleeding."
        },
        {
            "condition": "chronic kidney disease",
            "contraindicated_drugs": ["ibuprofen", "naproxen", "gentamicin", "metformin", "vancomycin"],
            "severity": "high",
            "reason": "NSAIDs reduce renal perfusion pressure; Metformin risks severe lactic acidosis when eGFR < 30 mL/min."
        },
        {
            "condition": "heart failure",
            "contraindicated_drugs": ["ibuprofen", "naproxen", "diltiazem", "verapamil"],
            "severity": "moderate",
            "reason": "NSAIDs promote sodium and water retention; Non-dihydropyridine CCBs exert negative inotropic effects worsening heart failure."
        }
    ]

    PREGNANCY_CONTRAINDICATIONS = [
        {
            "drug": "lisinopril",
            "category": "teratogen",
            "risk": "FDA Black Box Warning: Causes fetal renal dysgenesis, oligohydramnios, pulmonary hypoplasia, and neonatal death in 2nd/3rd trimesters."
        },
        {
            "drug": "losartan",
            "category": "teratogen",
            "risk": "Angiotensin receptor blockers cause severe fetopathy and renal agenesis in pregnancy."
        },
        {
            "drug": "atorvastatin",
            "category": "teratogen",
            "risk": "Cholesterol synthesis is essential for fetal organ and neurological development."
        },
        {
            "drug": "warfarin",
            "category": "teratogen",
            "risk": "Causes Fetal Warfarin Syndrome (nasal hypoplasia, chondrodysplasia punctata, and central nervous system defects)."
        },
        {
            "drug": "isotretinoin",
            "category": "teratogen",
            "risk": "High teratogenicity risk causing severe craniofacial, cardiac, and thymic malformations."
        },
        {
            "drug": "methotrexate",
            "category": "teratogen",
            "risk": "Folate antagonist causing fetal death, neural tube defects, and severe skeletal malformations."
        },
        {
            "drug": "valproate",
            "category": "teratogen",
            "risk": "High risk of neural tube defects (spina bifida) and significant cognitive impairment."
        }
    ]

    def check_safety(
        self,
        current_medications: List[str],
        new_medication_or_query: str,
        patient_allergies: Optional[List[str]] = None,
        patient_conditions: Optional[List[str]] = None,
        is_pregnant: bool = False
    ) -> Dict[str, Any]:
        alerts = []
        patient_allergies = [a.lower().strip() for a in (patient_allergies or [])]
        patient_conditions = [c.lower().strip() for c in (patient_conditions or [])]
        
        all_meds = [m.lower().strip() for m in current_medications]
        query_lower = new_medication_or_query.lower().strip()

        # Extract potential drugs mentioned in query text
        candidate_drugs = set(all_meds)
        # Search for known interaction drugs in query
        for d in self.KNOWN_INTERACTIONS:
            for drug_name in [d["drug_a"], d["drug_b"]]:
                if drug_name in query_lower:
                    candidate_drugs.add(drug_name)
        for d in self.PREGNANCY_CONTRAINDICATIONS:
            if d["drug"] in query_lower:
                candidate_drugs.add(d["drug"])
        for c in self.ALLERGY_CROSS_REACTIVITY:
            for d in c["cross_reactive_drugs"]:
                if d in query_lower:
                    candidate_drugs.add(d)
        for cond in self.CONDITION_CONTRAINDICATIONS:
            for d in cond["contraindicated_drugs"]:
                if d in query_lower:
                    candidate_drugs.add(d)

        drug_list = list(candidate_drugs)
        has_major_conflict = False

        # 1. Check Drug-Drug Interactions
        for i in range(len(drug_list)):
            for j in range(i + 1, len(drug_list)):
                med1 = drug_list[i]
                med2 = drug_list[j]
                for inter in self.KNOWN_INTERACTIONS:
                    if (inter["drug_a"] in med1 and inter["drug_b"] in med2) or \
                       (inter["drug_b"] in med1 and inter["drug_a"] in med2):
                        severity = inter["severity"]
                        if severity in ["major", "contraindicated"]:
                            has_major_conflict = True
                        alerts.append({
                            "type": "DRUG_INTERACTION",
                            "severity": severity,
                            "drugs": [med1, med2],
                            "message": f"Conflict between '{med1.capitalize()}' and '{med2.capitalize()}': {inter['effect']}",
                            "recommendation": inter["recommendation"]
                        })

        # 2. Check Allergy Cross-Reactivity
        for med in drug_list:
            for allergen in patient_allergies:
                for cross in self.ALLERGY_CROSS_REACTIVITY:
                    if cross["allergen"] in allergen or allergen in cross["allergen"]:
                        for rx_drug in cross["cross_reactive_drugs"]:
                            if rx_drug in med or med in rx_drug:
                                has_major_conflict = True
                                alerts.append({
                                    "type": "ALLERGY_CROSS_REACTIVITY",
                                    "severity": "contraindicated",
                                    "drugs": [med],
                                    "message": f"Patient has documented allergy to '{allergen.capitalize()}'. Medication '{med.capitalize()}' is cross-reactive: {cross['warning']}",
                                    "recommendation": "Do not administer. Select alternative non-cross-reactive pharmacological class."
                                })

        # 3. Check Condition Contraindications
        for med in drug_list:
            for cond in patient_conditions:
                for rule in self.CONDITION_CONTRAINDICATIONS:
                    if rule["condition"] in cond or cond in rule["condition"]:
                        for contra_drug in rule["contraindicated_drugs"]:
                            if contra_drug in med or med in contra_drug:
                                if rule["severity"] == "high":
                                    has_major_conflict = True
                                alerts.append({
                                    "type": "CONTRAINDICATION",
                                    "severity": rule["severity"],
                                    "drugs": [med],
                                    "condition": cond,
                                    "message": f"Medication '{med.capitalize()}' is contraindicated in patients with '{cond.capitalize()}': {rule['reason']}",
                                    "recommendation": "Consult physician for safe alternative medication class."
                                })

        # 4. Check Pregnancy Teratogenicity
        if is_pregnant:
            for med in drug_list:
                for preg_rule in self.PREGNANCY_CONTRAINDICATIONS:
                    if preg_rule["drug"] in med or med in preg_rule["drug"]:
                        has_major_conflict = True
                        alerts.append({
                            "type": "PREGNANCY_CONTRAINDICATION",
                            "severity": "contraindicated",
                            "drugs": [med],
                            "message": f"Medication '{med.capitalize()}' is strictly contraindicated in pregnancy: {preg_rule['risk']}",
                            "recommendation": "Immediate obstetric review required. Substitute with pregnancy-safe medication."
                        })

        return {
            "has_alerts": len(alerts) > 0,
            "has_major_conflict": has_major_conflict,
            "alerts": alerts
        }

# Singleton instance
medication_engine = MedicationSafetyEngine()
