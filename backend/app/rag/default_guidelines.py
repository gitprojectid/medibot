"""
Comprehensive Clinical Knowledge Base & Evidence Repository
Contains authoritative medical guidelines across 10 core clinical domains:
Cardiovascular, Respiratory, Endocrinology, Infectious/Sepsis, Gastroenterology,
Neurology/Stroke, Pharmacology/Toxicology, Obstetrics, Pediatrics/Geriatrics, Mental Health.
"""

DEFAULT_MEDICAL_DOCUMENTS = [
    {
        "title": "AHA/ACC 2024 Clinical Practice Guidelines for High Blood Pressure & Hypertension",
        "authority": "American Heart Association / American College of Cardiology",
        "medical_domain": "Cardiology",
        "version": "2024.1",
        "source_url": "https://www.heart.org/en/health-topics/high-blood-pressure",
        "publication_date": "2024-01-15",
        "full_text": """
Blood Pressure Classification in Adults:
- Normal Blood Pressure: Systolic < 120 mm Hg AND Diastolic < 80 mm Hg.
- Elevated Blood Pressure: Systolic 120-129 mm Hg AND Diastolic < 80 mm Hg. Recommended management: Lifestyle modification, sodium restriction (<1500 mg/day), regular aerobic exercise (150 min/week), DASH diet adherence.
- Stage 1 Hypertension: Systolic 130-139 mm Hg OR Diastolic 80-89 mm Hg. Clinical management: 10-year ASCVD risk calculation. If ASCVD risk >= 10%, initiate single first-line antihypertensive agent (ACE inhibitor, ARB, CCB, or thiazide diuretic) alongside strict lifestyle measures.
- Stage 2 Hypertension: Systolic >= 140 mm Hg OR Diastolic >= 90 mm Hg. Clinical management: Prompt initiation of two first-line antihypertensive medications of different classes, monthly blood pressure monitoring, home BP logs.
- Hypertensive Crisis / Urgency / Emergency: Systolic > 180 mm Hg and/or Diastolic > 120 mm Hg.
  * Hypertensive Emergency: BP > 180/120 with target organ damage (acute chest pain, dyspnea, neurological deficit, visual disturbance, acute kidney injury, encephalopathy). Requires immediate emergency room evaluation and IV antihypertensives (e.g., Nicardipine, Labetalol).
  * Red Flags: Chest pressure radiating to arm/jaw, diaphoresis, acute dyspnea, sudden weakness.
"""
    },
    {
        "title": "GINA 2024 Global Strategy for Asthma Management and COPD GOLD Guidelines",
        "authority": "Global Initiative for Asthma / Global Initiative for Chronic Obstructive Lung Disease",
        "medical_domain": "Pulmonology",
        "version": "2024.2",
        "source_url": "https://ginasthma.org/reports/",
        "publication_date": "2024-02-01",
        "full_text": """
Asthma Evaluation, Stepwise Therapy & Acute Exacerbation:
- Pathophysiology: Chronic airway inflammation, bronchial hyperresponsiveness, and variable airflow limitation.
- Maintenance & Reliever Therapy: Low-dose inhaled corticosteroid (ICS)-formoterol is the preferred reliever across all asthma severity steps to reduce severe exacerbation risks.
- Acute Exacerbation Red Flags: Severe breathlessness, inability to complete full sentences in one breath, tachypnea (>25 breaths/min), silent chest on auscultation, accessory muscle use, cyanosis, oxygen saturation SpO2 < 92%.
- Bronchospasm Drug Safety Contraindications: Non-cardioselective beta-blockers (e.g., Propranolol, Timolol) and Aspirin/NSAIDs in patients with Aspirin-Exacerbated Respiratory Disease (AERD) are strictly contraindicated due to acute bronchoconstriction risk.
- Home Action Plan: Peak expiratory flow (PEF) monitoring. If PEF < 60% of personal best, initiate emergency bronchodilator protocol and seek immediate emergency care.
"""
    },
    {
        "title": "ADA 2024 Standards of Care in Diabetes & Glycemic Crisis Management",
        "authority": "American Diabetes Association",
        "medical_domain": "Endocrinology",
        "version": "2024.1",
        "source_url": "https://diabetesjournals.org/care/issue/47/Supplement_1",
        "publication_date": "2024-01-01",
        "full_text": """
Diagnostic Criteria & Glycemic Targets:
- Fasting Plasma Glucose >= 126 mg/dL (7.0 mmol/L) on two separate occasions.
- Hemoglobin A1c (HbA1c) >= 6.5% (48 mmol/mol). General non-pregnant adult target: HbA1c < 7.0%.
- 2-Hour Oral Glucose Tolerance Test (OGTT) >= 200 mg/dL (11.1 mmol/L).
- Hypoglycemia Management (Rule of 15):
  * Level 1 (Alert): Blood Glucose 54-70 mg/dL. Treat with 15-20g fast-acting carbohydrate (4 oz juice, 4 glucose tablets), recheck in 15 minutes.
  * Level 2 (Clinically Significant): Blood Glucose < 54 mg/dL. Immediate treatment and clinical evaluation.
  * Level 3 (Severe): Cognitive impairment requiring assistance. Administer emergency glucagon (nasal Baqsimi or IM glucagon) and call 911.
- Hyperglycemic Crises (Diabetic Ketoacidosis DKA / Hyperosmolar Hyperglycemic State HHS):
  * Symptoms: Polyuria, polydipsia, Kussmaul breathing, fruity breath odor, nausea, vomiting, confusion, blood glucose > 250 mg/dL with ketones. Requires immediate emergency hospitalization.
"""
    },
    {
        "title": "Surviving Sepsis Campaign & CDC Infection Triage Protocols",
        "authority": "Surviving Sepsis Campaign / CDC",
        "medical_domain": "Infectious Disease & Critical Care",
        "version": "2024.1",
        "source_url": "https://www.cdc.gov/sepsis/clinicaltools/",
        "publication_date": "2024-03-01",
        "full_text": """
Sepsis & Severe Systemic Infection Identification:
- Definition: Life-threatening organ dysfunction caused by a dysregulated host response to infection.
- Quick SOFA (qSOFA) Bedside Screening Criteria (Score >= 2 indicates high risk):
  1. Respiratory Rate >= 22 breaths per minute.
  2. Altered mental status (Glasgow Coma Scale GCS < 15 or acute confusion).
  3. Systolic Blood Pressure <= 100 mm Hg.
- Systemic Red Flags: High fever (>103°F / 39.4°C) or hypothermia (<96.8°F / 36°C), severe shaking chills, extreme body pain, mottled or pale skin, decreased urine output (<0.5 mL/kg/h).
- Time-Critical Action: Immediate transfer to emergency facility for blood cultures, broad-spectrum IV antibiotics, and fluid resuscitation within the 1-hour golden bundle.
"""
    },
    {
        "title": "AHA/ASA 2024 Acute Stroke Clinical Evaluation & FAST-ED Guidelines",
        "authority": "American Heart Association / American Stroke Association",
        "medical_domain": "Neurology",
        "version": "2024.1",
        "source_url": "https://www.stroke.org/en/about-stroke/stroke-symptoms",
        "publication_date": "2024-01-20",
        "full_text": """
Acute Cerebrovascular Event Identification & Window of Opportunity:
- FAST Protocol:
  * Face: Sudden facial drooping or asymmetry when smiling.
  * Arms: Sudden arm drift or weakness when holding both arms outstretched.
  * Speech: Slurred speech, word-finding difficulty, or inability to repeat a simple sentence.
  * Time: Note the exact "Last Known Well" time and call 911 immediately.
- Thrombolytic / Thrombectomy Time Windows:
  * Intravenous Thrombolysis (tPA / Tenecteplase): Within 4.5 hours of symptom onset.
  * Endovascular Mechanical Thrombectomy: Up to 24 hours for large vessel occlusions (LVO).
- Severe Headache Red Flags (SNOOP Criteria):
  * Systemic symptoms (fever, weight loss).
  * Neurologic deficit or confusion.
  * Onset sudden (Thunderclap headache reaching peak severity in <1 minute).
  * Older age of onset (>50 years) or positional changes.
  * Papilledema or worsening with Valsalva maneuver. Thunderclap headache indicates urgent non-contrast CT for Subarachnoid Hemorrhage.
"""
    },
    {
        "title": "ACG Clinical Guidelines for Acute Abdominal Pain & GI Bleeding",
        "authority": "American College of Gastroenterology",
        "medical_domain": "Gastroenterology",
        "version": "2024.1",
        "source_url": "https://gi.org/clinical-guidelines/",
        "publication_date": "2024-02-15",
        "full_text": """
Acute Abdominal Pain Triage & Surgical Emergencies:
- Right Lower Quadrant (RLQ) Pain (Alvarado Criteria for Appendicitis): Migration of periumbilical pain to RLQ, localized tenderness (McBurney's point), rebound tenderness (Blumberg's sign), anorexia, nausea/vomiting, fever, leukocytosis. Requires prompt surgical consult and ultrasound/CT.
- Upper GI Hemorrhage Red Flags: Hematemesis (bright red blood in vomit), coffee-ground emesis, melena (black tarry foul-smelling stools), orthostatic syncope. Strict contraindication: Discontinue all NSAIDs, anticoagulants, and antiplatelets immediately; urgent upper endoscopy.
- Acute Pancreatitis: Severe epigastric pain radiating directly to the back, exacerbated by supine position, elevated serum lipase/amylase (>3x upper limit of normal). Requires IV hydration and hospital admission.
"""
    },
    {
        "title": "Clinical Pharmacokinetics & Multi-Drug Interaction Safety Protocols",
        "authority": "FDA / WHO Pharmacovigilance / Lexicomp Clinical Pharmacology",
        "medical_domain": "Pharmacology",
        "version": "2024.1",
        "source_url": "https://www.fda.gov/drugs/drug-safety-and-availability",
        "publication_date": "2024-01-10",
        "full_text": """
Critical High-Risk Pharmacological Combinations & Contraindications:
1. Warfarin + NSAIDs / Aspirin / Clopidogrel: Severe pharmacokinetic & pharmacodynamic synergy leading to gastrointestinal ulceration and major hemorrhage. Target INR monitoring required.
2. ACE Inhibitors (Lisinopril, Enalapril) + Potassium-Sparing Diuretics (Spironolactone, Eplerenone) + Potassium Supplements: Severe, potentially fatal hyperkalemia causing cardiac arrhythmias and asystole. Serum potassium and renal function monitoring mandatory.
3. SSRIs (Sertraline, Fluoxetine, Escitalopram) + Tramadol / MAOIs / Triptans / Linezolid: High risk of Serotonin Syndrome (hyperthermia, clonus, autonomic instability, hyperreflexia, agitation).
4. Statins (Atorvastatin, Simvastatin) + CYP3A4 Inhibitors (Clarithromycin, Ketoconazole, Grapefruit juice): Inhibits statin clearance leading to toxic accumulation, acute rhabdomyolysis, and acute tubular necrosis.
5. Metformin + IV Radiocontrast Media / Renal Failure (eGFR < 30 mL/min): Severe risk of Metformin-Associated Lactic Acidosis (MALA). Metformin must be held 48 hours prior to contrast imaging.
"""
    },
    {
        "title": "ACOG Clinical Practice Guidelines for Obstetric Emergencies & Teratology",
        "authority": "American College of Obstetricians and Gynecologists",
        "medical_domain": "Obstetrics & Maternal-Fetal Medicine",
        "version": "2024.1",
        "source_url": "https://www.acog.org/clinical/clinical-guidance",
        "publication_date": "2024-03-01",
        "full_text": """
Maternal-Fetal Safety, Hypertensive Disorders of Pregnancy & Teratogens:
- Preeclampsia / Eclampsia Criteria: New onset hypertension (BP >= 140/90 mm Hg after 20 weeks gestation) accompanied by proteinuria or severe features (severe headache unresponsive to medication, visual scotoma, right upper quadrant/epigastric pain, thrombocytopenia, pulmonary edema). Eclampsia involves generalized seizures; requires immediate Magnesium Sulfate and urgent obstetric delivery.
- Vaginal Bleeding in Pregnancy: In early pregnancy, rule out Ectopic Pregnancy (unilateral pelvic pain, cervical motion tenderness, subnormal hCG rise). In late pregnancy, rule out Placental Abruption (painful, dark bleeding with uterine tetany) and Placenta Previa (painless bright red bleeding).
- Absolute Teratogenic Drugs (Strictly Contraindicated in Pregnancy):
  * ACE Inhibitors / ARBs (Lisinopril, Losartan): Fetal renal dysgenesis, oligohydramnios, skull hypoplasia.
  * Statins (Atorvastatin): Cholesterol synthesis disruption.
  * Methotrexate, Isotretinoin (Accutane), Valproic Acid / Carbamazepine (Neural tube defects), Warfarin (Fetal warfarin syndrome, skeletal abnormalities).
"""
    },
    {
        "title": "AAP & AGS Clinical Guidelines for Pediatric and Geriatric Patient Safety",
        "authority": "American Academy of Pediatrics / American Geriatrics Society (Beers Criteria)",
        "medical_domain": "Pediatrics & Geriatrics",
        "version": "2024.1",
        "source_url": "https://www.americangeriatrics.org/publications-tools/clinical-practice-tools/beers-criteria",
        "publication_date": "2024-02-01",
        "full_text": """
Age-Specific Vulnerabilities & Clinical Precautions:
- Pediatric Fever Red Flags:
  * Infants < 3 months of age with rectal temperature >= 100.4°F (38.0°C) require immediate emergency department evaluation and full septic workup (blood, urine, CSF).
  * Pediatric Signs of Respiratory Distress: Grunting, nasal flaring, intercostal/subcostal retractions, stridor at rest.
  * Strict Medication Safety: NEVER administer Aspirin to children/adolescents with viral illness due to Reye's Syndrome risk. Avoid over-the-counter cough/cold medicines in children < 4 years.
- Geriatric Beers Criteria & Polypharmacy Safeguards:
  * High-risk medications to avoid in older adults: First-generation antihistamines (Diphenhydramine) due to anticholinergic delirium/urinary retention, Benzodiazepines (Diazepam) due to falls/cognitive decline, long-term NSAIDs due to peptic ulcers and acute kidney injury.
  * Atypical Presentations: Sepsis, myocardial infarction, or pneumonia in geriatric patients often presents with acute confusion/delirium rather than fever or typical chest pain.
"""
    },
    {
        "title": "APA Clinical Guidelines for Suicide Risk Assessment & Crisis De-Escalation (988)",
        "authority": "American Psychiatric Association / 988 Suicide & Crisis Lifeline",
        "medical_domain": "Psychiatry & Behavioral Health",
        "version": "2024.1",
        "source_url": "https://988lifeline.org/",
        "publication_date": "2024-01-01",
        "full_text": """
Psychiatric Emergency Triage & Crisis Intervention Protocol:
- Active Suicidal Ideation Assessment:
  1. Suicidal intent, plan, and access to lethal means (firearms, medications, heights).
  2. Severe hopelessness, agitation, psychosis, or substance intoxication.
- Immediate De-escalation Protocol:
  * Empathy, active listening, validation of emotional pain without judgment.
  * Immediate connection to National Crisis Helplines: Call or text **988** (available 24/7/365, free and confidential).
  * If acute imminent danger is present, contact 911 or direct to nearest emergency crisis center.
  * Safety Planning: Removal of lethal means, identifying safe contact persons, establishing follow-up mental health appointments.
"""
    }
]
