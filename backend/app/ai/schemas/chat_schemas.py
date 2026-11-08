from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ExtractedSymptom(BaseModel):
    name: str = Field(description="Normalized name of symptom")
    onset: Optional[str] = Field(default=None, description="When the symptom started")
    duration: Optional[str] = Field(default=None, description="How long it lasts")
    severity: Optional[int] = Field(default=None, ge=1, le=10, description="Severity score 1-10")
    location: Optional[str] = Field(default=None, description="Anatomical location")
    quality: Optional[str] = Field(default=None, description="Quality: sharp, dull, throbbing, etc.")
    triggers: Optional[str] = Field(default=None, description="Aggravating factors")
    relieving_factors: Optional[str] = Field(default=None, description="Relieving factors")
    associated_symptoms: List[str] = Field(default_factory=list, description="Associated symptoms")

class SymptomExtractionResult(BaseModel):
    symptoms: List[ExtractedSymptom] = Field(default_factory=list)
    chief_complaint: Optional[str] = None
    missing_critical_info: List[str] = Field(default_factory=list)
    suggested_follow_up_questions: List[str] = Field(default_factory=list)

class DifferentialCandidate(BaseModel):
    name: str
    supporting_features: List[str] = Field(default_factory=list)
    missing_features: List[str] = Field(default_factory=list)
    contradicting_features: List[str] = Field(default_factory=list)
    urgency: str = "routine" # routine, prompt, urgent, emergency

class StructuredReasoningOutput(BaseModel):
    possible_conditions: List[DifferentialCandidate] = Field(default_factory=list)
    risk_level: str = "low" # low, medium, high, emergency
    needs_escalation: bool = False
    escalation_reason: Optional[str] = None
    missing_information: List[str] = Field(default_factory=list)
    clinical_explanation: str
    recommendation: str

class CitationSource(BaseModel):
    title: str
    authority: str
    domain: str
    version: Optional[str] = "1.0"
    url: Optional[str] = None
    excerpt: Optional[str] = None

class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str
    language: Optional[str] = "en"
    patient_context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    conversation_id: str
    message_id: str
    response: str
    triage_level: int # 0 to 4
    triage_label: str # Informational, Low Concern, Needs Evaluation, Urgent, Emergency
    is_emergency: bool = False
    emergency_details: Optional[Dict[str, Any]] = None
    structured_symptoms: List[ExtractedSymptom] = Field(default_factory=list)
    differential_considerations: List[Dict[str, Any]] = Field(default_factory=list)
    missing_information: List[str] = Field(default_factory=list)
    suggested_follow_ups: List[str] = Field(default_factory=list)
    safety_warnings: List[str] = Field(default_factory=list)
    sources: List[CitationSource] = Field(default_factory=list)
    medication_alerts: List[Dict[str, Any]] = Field(default_factory=list)
    escalation_offered: bool = False
    evidence_grounding: str = "SOURCE_SUPPORTED" # SOURCE_SUPPORTED, GENERAL_KNOWLEDGE, UNCERTAIN, INSUFFICIENT_EVIDENCE
    ml_risk_score: Optional[float] = 0.0
    ml_predicted_triage: Optional[int] = 0
    rl_action: Optional[str] = "COMPREHENSIVE_GUIDELINES"
    rl_expected_q: Optional[float] = 0.0
    ml_explanatory_factors: List[Dict[str, Any]] = Field(default_factory=list)
