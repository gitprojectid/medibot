import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.database.models import (
    User, PatientProfile, MedicalCondition, Medication, Allergy, VitalSign, ConsentRecord, MedicalDocument
)
from backend.app.auth.security import get_password_hash
from backend.app.rag.default_guidelines import DEFAULT_MEDICAL_DOCUMENTS

logger = logging.getLogger(__name__)

async def seed_database(db: AsyncSession):
    # 1. Check if patient user already exists
    res = await db.execute(select(User).where(User.email == "patient@healthcare.ai"))
    if res.scalars().first():
        return # Database already seeded

    logger.info("Seeding initial demo data and verified guidelines...")

    # Create Patient
    patient = User(
        email="patient@healthcare.ai",
        hashed_password=get_password_hash("password123"),
        full_name="Alex Johnson",
        role="patient"
    )
    # Create Clinician
    clinician = User(
        email="doctor@healthcare.ai",
        hashed_password=get_password_hash("password123"),
        full_name="Dr. Sarah Mitchell, MD",
        role="clinician"
    )
    # Create Admin
    admin = User(
        email="admin@healthcare.ai",
        hashed_password=get_password_hash("password123"),
        full_name="System Administrator",
        role="admin"
    )
    db.add_all([patient, clinician, admin])
    await db.flush()

    # Patient Profile
    profile = PatientProfile(
        user_id=patient.id,
        age=45,
        sex="female",
        is_pregnant=False,
        preferred_language="en",
        emergency_contact_name="Mark Johnson (Spouse)",
        emergency_contact_phone="+1-555-0199",
        notes="History of mild hypertension and seasonal allergies."
    )
    db.add(profile)
    await db.flush()

    # Conditions
    c1 = MedicalCondition(
        patient_profile_id=profile.id,
        condition_name="Hypertension",
        diagnosed_year=2021,
        severity="mild"
    )
    c2 = MedicalCondition(
        patient_profile_id=profile.id,
        condition_name="Mild Asthma",
        diagnosed_year=2018,
        severity="mild"
    )
    # Active Meds
    m1 = Medication(
        patient_profile_id=profile.id,
        generic_name="Lisinopril",
        brand_names=["Prinivil", "Zestril"],
        drug_class="ACE Inhibitor",
        dosage="10mg",
        frequency="Once daily"
    )
    # Allergies
    a1 = Allergy(
        patient_profile_id=profile.id,
        allergen_name="Penicillin",
        reaction="Severe rash and urticaria",
        severity="severe"
    )
    # Vitals
    v1 = VitalSign(patient_profile_id=profile.id, vital_type="bp_systolic", value=128, unit="mmHg")
    v2 = VitalSign(patient_profile_id=profile.id, vital_type="bp_diastolic", value=82, unit="mmHg")
    v3 = VitalSign(patient_profile_id=profile.id, vital_type="heart_rate", value=74, unit="bpm")
    v4 = VitalSign(patient_profile_id=profile.id, vital_type="spo2", value=98, unit="%")
    v5 = VitalSign(patient_profile_id=profile.id, vital_type="temperature", value=98.6, unit="°F")

    # Consent
    consent = ConsentRecord(
        user_id=patient.id,
        consent_scope="medical_data_storage",
        consent_given=True
    )

    db.add_all([c1, c2, m1, a1, v1, v2, v3, v4, v5, consent])

    # Seed verified medical guidelines
    for doc in DEFAULT_MEDICAL_DOCUMENTS:
        med_doc = MedicalDocument(
            title=doc["title"],
            authority=doc["authority"],
            medical_domain=doc["medical_domain"],
            version=doc.get("version", "1.0"),
            source_url=doc.get("url"),
            publication_date=doc.get("publication_date"),
            review_date=doc.get("review_date"),
            full_text=doc["full_text"]
        )
        db.add(med_doc)

    await db.commit()
    logger.info("Demo data and guidelines seeded successfully.")
