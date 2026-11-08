import datetime
import uuid
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="patient") # patient, clinician, admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    patient_profile = relationship("PatientProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")
    consents = relationship("ConsentRecord", back_populates="user", cascade="all, delete-orphan")

class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    age = Column(Integer, nullable=True)
    sex = Column(String(20), nullable=True) # male, female, other, unspecified
    is_pregnant = Column(Boolean, default=False)
    pregnancy_weeks = Column(Integer, nullable=True)
    preferred_language = Column(String(10), default="en") # en, ta, hi, te, ml, kn
    emergency_contact_name = Column(String(255), nullable=True)
    emergency_contact_phone = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="patient_profile")
    conditions = relationship("MedicalCondition", back_populates="patient_profile", cascade="all, delete-orphan")
    medications = relationship("Medication", back_populates="patient_profile", cascade="all, delete-orphan")
    allergies = relationship("Allergy", back_populates="patient_profile", cascade="all, delete-orphan")
    vitals = relationship("VitalSign", back_populates="patient_profile", cascade="all, delete-orphan")

class VitalSign(Base):
    __tablename__ = "vital_signs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_profile_id = Column(String(36), ForeignKey("patient_profiles.id"), nullable=False)
    vital_type = Column(String(50), nullable=False) # bp_systolic, bp_diastolic, heart_rate, spo2, temperature, blood_glucose, respiratory_rate
    value = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False) # mmHg, bpm, %, F, C, mg/dL
    source = Column(String(50), default="patient_entered") # patient_entered, device, clinician
    measured_at = Column(DateTime, default=datetime.datetime.utcnow)

    patient_profile = relationship("PatientProfile", back_populates="vitals")

class MedicalCondition(Base):
    __tablename__ = "medical_conditions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_profile_id = Column(String(36), ForeignKey("patient_profiles.id"), nullable=False)
    condition_name = Column(String(255), nullable=False)
    diagnosed_year = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    severity = Column(String(50), nullable=True) # mild, moderate, severe
    notes = Column(Text, nullable=True)

    patient_profile = relationship("PatientProfile", back_populates="conditions")

class Allergy(Base):
    __tablename__ = "allergies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_profile_id = Column(String(36), ForeignKey("patient_profiles.id"), nullable=False)
    allergen_name = Column(String(255), nullable=False)
    reaction = Column(String(255), nullable=True) # rash, anaphylaxis, swelling
    severity = Column(String(50), default="moderate") # mild, moderate, severe/anaphylaxis

    patient_profile = relationship("PatientProfile", back_populates="allergies")

class Medication(Base):
    __tablename__ = "medications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_profile_id = Column(String(36), ForeignKey("patient_profiles.id"), nullable=True)
    generic_name = Column(String(255), nullable=False)
    brand_names = Column(JSON, default=list) # e.g. ["Tylenol", "Panadol"]
    drug_class = Column(String(255), nullable=True)
    dosage = Column(String(100), nullable=True)
    frequency = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    indications = Column(JSON, default=list)
    contraindications = Column(JSON, default=list)
    warnings = Column(JSON, default=list)
    common_adverse_effects = Column(JSON, default=list)

    patient_profile = relationship("PatientProfile", back_populates="medications")

class MedicationInteraction(Base):
    __tablename__ = "medication_interactions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    drug_a = Column(String(255), nullable=False, index=True)
    drug_b = Column(String(255), nullable=False, index=True)
    severity = Column(String(50), nullable=False) # major, moderate, minor, contraindicated
    description = Column(Text, nullable=False)
    clinical_recommendation = Column(Text, nullable=False)
    evidence_source = Column(String(255), default="Verified Clinical Pharmacology Database")

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    title = Column(String(255), default="Health Consultation")
    summary = Column(Text, nullable=True)
    language = Column(String(10), default="en")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")
    symptoms = relationship("SymptomRecord", back_populates="conversation", cascade="all, delete-orphan")
    risk_assessments = relationship("RiskAssessment", back_populates="conversation", cascade="all, delete-orphan")
    escalations = relationship("Escalation", back_populates="conversation", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), ForeignKey("conversations.id"), nullable=False)
    sender_role = Column(String(50), nullable=False) # user, assistant, system
    content = Column(Text, nullable=False)
    triage_level = Column(Integer, default=0) # 0=info, 1=low, 2=eval, 3=urgent, 4=emergency
    is_emergency = Column(Boolean, default=False)
    metadata_json = Column(JSON, default=dict) # citations, follow_ups, warnings, symptoms_extracted
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")

class SymptomRecord(Base):
    __tablename__ = "symptom_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), ForeignKey("conversations.id"), nullable=False)
    symptom_name = Column(String(255), nullable=False)
    onset = Column(String(100), nullable=True)
    duration = Column(String(100), nullable=True)
    severity_score = Column(Integer, nullable=True) # 1-10
    location = Column(String(255), nullable=True)
    quality = Column(String(100), nullable=True) # sharp, dull, throbbing, crushing, burning
    triggers = Column(String(255), nullable=True)
    relieving_factors = Column(String(255), nullable=True)
    associated_symptoms = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    conversation = relationship("Conversation", back_populates="symptoms")

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), ForeignKey("conversations.id"), nullable=False)
    triage_level = Column(Integer, nullable=False) # 0-4
    triage_label = Column(String(50), nullable=False) # Informational, Low Concern, Needs Evaluation, Urgent, Emergency
    risk_factors = Column(JSON, default=list)
    red_flags_detected = Column(JSON, default=list)
    possible_conditions = Column(JSON, default=list)
    missing_information = Column(JSON, default=list)
    recommended_action = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    conversation = relationship("Conversation", back_populates="risk_assessments")

class Escalation(Base):
    __tablename__ = "escalations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), ForeignKey("conversations.id"), nullable=False)
    patient_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    reason = Column(String(100), nullable=False) # emergency, high_risk, drug_interaction, patient_request, uncertainty
    triage_level = Column(Integer, nullable=False)
    status = Column(String(50), default="pending") # pending, under_review, resolved, dismissed
    clinical_summary = Column(Text, nullable=False)
    clinician_notes = Column(Text, nullable=True)
    reviewed_by_clinician_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    conversation = relationship("Conversation", back_populates="escalations")

class MedicalDocument(Base):
    __tablename__ = "medical_documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    authority = Column(String(255), nullable=False) # WHO, CDC, NHS, Ministry of Health, AHA
    medical_domain = Column(String(100), nullable=False) # Cardiology, Pulmonology, Pediatrics, etc.
    version = Column(String(50), default="1.0")
    source_url = Column(String(500), nullable=True)
    publication_date = Column(String(50), nullable=True)
    review_date = Column(String(50), nullable=True)
    full_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("medical_documents.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    chunk_text = Column(Text, nullable=False)
    keywords = Column(JSON, default=list)
    embedding_json = Column(JSON, nullable=True) # Stored embeddings for local vector matching

    document = relationship("MedicalDocument", back_populates="chunks")

class ConsentRecord(Base):
    __tablename__ = "consent_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    consent_scope = Column(String(100), nullable=False) # medical_data_storage, clinician_sharing, analytics
    consent_given = Column(Boolean, default=True)
    consent_version = Column(String(50), default="v1.0")
    consent_timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    revocation_timestamp = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="consents")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    action_type = Column(String(100), nullable=False) # auth_login, pii_access, ai_generation, emergency_triggered, escalation_created, consent_updated
    details = Column(JSON, default=dict)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    user = relationship("User", back_populates="audit_logs")

class ClinicalNote(Base):
    __tablename__ = "clinical_notes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), nullable=False, index=True)
    note_type = Column(String(50), default="SOAP") # SOAP, Progress, Discharge, Handoff
    subjective = Column(Text, nullable=False)
    objective = Column(Text, nullable=False)
    assessment = Column(Text, nullable=False)
    plan = Column(Text, nullable=False)
    physician_name = Column(String(255), nullable=False)
    status = Column(String(50), default="CLINICIAN_VERIFIED_AND_SIGNED")
    provenance_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class LabResultRecord(Base):
    __tablename__ = "lab_result_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), nullable=False, index=True)
    test_name = Column(String(255), nullable=False)
    value = Column(String(100), nullable=False)
    unit = Column(String(50), nullable=False)
    reference_range = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False) # Normal, High, Critical High, Low
    performed_at = Column(DateTime, default=datetime.datetime.utcnow)

class HospitalBedRecord(Base):
    __tablename__ = "hospital_beds"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    department_id = Column(String(50), nullable=False, index=True)
    department_name = Column(String(100), nullable=False)
    bed_number = Column(String(50), nullable=False)
    patient_id = Column(String(36), nullable=True)
    patient_name = Column(String(255), nullable=True)
    is_occupied = Column(Boolean, default=False)
    admitted_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

