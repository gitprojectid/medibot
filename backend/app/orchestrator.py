import logging
import uuid
import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.config import settings
from backend.app.ai.providers.ollama_provider import ollama_provider
from backend.app.ai.prompts.system_prompts import MEDICAL_SAFETY_SYSTEM_PROMPT
from backend.app.safety.emergency.emergency_engine import emergency_engine
from backend.app.safety.triage.triage_engine import triage_engine
from backend.app.safety.validators.response_validator import response_safety_validator
from backend.app.safety.escalation.escalation_service import escalation_service
from backend.app.medical.symptoms.symptom_engine import symptom_engine
from backend.app.medical.medications.medication_engine import medication_engine
from backend.app.medical.terminology.normalizer import terminology_normalizer
from backend.app.medical.differential.differential_engine import differential_engine
from backend.app.rag.knowledge_base import knowledge_rag
from backend.app.ml.clinical_ml_model import clinical_ml_model
from backend.app.ml.clinical_rl_agent import clinical_rl_agent
from backend.app.ai.schemas.chat_schemas import (
    ChatRequest, ChatResponse, ExtractedSymptom, CitationSource
)
from backend.app.database.models import (
    Conversation, Message, PatientProfile, SymptomRecord, RiskAssessment, AuditLog, User
)

logger = logging.getLogger(__name__)

class MedicalSafetyOrchestrator:
    """
    Central Coordinator executing the complete safety-first medical conversational pipeline
    empowered with Machine Learning (ML) Triage & Reinforcement Learning (RL) Policy Optimization.
    """

    async def process_chat(
        self,
        request: ChatRequest,
        db: AsyncSession,
        current_user: Optional[User] = None
    ) -> ChatResponse:
        start_time = datetime.datetime.now(datetime.timezone.utc)
        user_message = request.message.strip()
        conv_id = request.conversation_id or str(uuid.uuid4())

        # 1. Audit Log: Log User Input
        audit = AuditLog(
            user_id=current_user.id if current_user else None,
            action_type="chat_request_received",
            details={"message_len": len(user_message), "conversation_id": conv_id}
        )
        db.add(audit)

        # 2. Multilingual Normalization
        normalized_text, detected_lang, mapped_terms = terminology_normalizer.normalize(user_message)

        # 3. Retrieve or Build Patient Context (Allergies, Medications, Conditions, Vitals)
        patient_context = request.patient_context or {}
        patient_meds = patient_context.get("medications", [])
        patient_allergies = patient_context.get("allergies", [])
        patient_conditions = patient_context.get("conditions", [])
        patient_vitals = patient_context.get("vitals", {})
        is_pregnant = patient_context.get("is_pregnant", False)

        if current_user and not patient_context:
            result = await db.execute(
                select(PatientProfile).where(PatientProfile.user_id == current_user.id)
            )
            profile = result.scalars().first()
            if profile:
                is_pregnant = profile.is_pregnant
                patient_context = {
                    "age": profile.age,
                    "sex": profile.sex,
                    "is_pregnant": profile.is_pregnant,
                    "language": profile.preferred_language,
                    "vitals": patient_vitals
                }

        # 4. Deterministic Emergency Detection
        emergency_match = emergency_engine.evaluate(normalized_text, patient_context)
        is_emergency = emergency_match is not None

        # 5. Machine Learning (ML) Clinical Risk Stratification
        ml_prediction = clinical_ml_model.predict(normalized_text, vitals=patient_vitals)
        ml_risk_score = ml_prediction["clinical_risk_score"]
        ml_predicted_triage = ml_prediction["predicted_triage_level"]
        ml_explanatory_factors = ml_prediction["top_explanatory_factors"]

        # 6. Symptom Extraction
        symptom_result = await symptom_engine.extract_symptoms(normalized_text)
        extracted_symptoms = symptom_result.symptoms

        # 7. Medication Safety Check
        med_check_result = medication_engine.check_safety(
            current_medications=patient_meds,
            new_medication_or_query=normalized_text,
            patient_allergies=patient_allergies,
            patient_conditions=patient_conditions,
            is_pregnant=is_pregnant
        )

        # 8. Deterministic Triage Classification
        triage_info = triage_engine.classify(
            text=normalized_text,
            is_emergency=is_emergency,
            extracted_symptoms=[s.model_dump() for s in extracted_symptoms],
            patient_context=patient_context
        )
        triage_level = max(triage_info["triage_level"], ml_predicted_triage if is_emergency else triage_info["triage_level"])
        triage_label = triage_info["triage_label"]

        # 9. Differential Considerations
        differential_list = differential_engine.evaluate_differential(extracted_symptoms, normalized_text)

        # 10. Knowledge Retrieval (RAG)
        rag_passages = knowledge_rag.search(normalized_text, top_k=2)
        citations = knowledge_rag.get_citations(normalized_text)
        
        evidence_text = ""
        if rag_passages:
            evidence_text = "\n\nVERIFIED CLINICAL EVIDENCE GUIDELINES:\n" + "\n".join(
                [f"- [{p['authority']} - {p['title']}]: {p['text']}" for p in rag_passages]
            )

        # 11. Reinforcement Learning (RL) Policy Selection (RLCF)
        query_category = "medications" if med_check_result["has_alerts"] else ("symptoms" if extracted_symptoms else "guidelines")
        user_role = current_user.role if current_user else "patient"
        rl_action, rl_directive, rl_expected_q = clinical_rl_agent.select_action(
            triage_tier=triage_level,
            is_emergency=is_emergency,
            user_role=user_role,
            query_category=query_category
        )

        # 12. Generate Response via Safety Pipeline or Emergency Direct Action
        if is_emergency:
            category_title = emergency_match.get("category", "Critical Medical Emergency")
            raw_response = (
                f"🚨 **CRITICAL MEDICAL EMERGENCY: {category_title.upper()}**\n\n"
                f"{emergency_match['disclaimer']}\n\n"
                f"### ⚡ **Immediate Life-Saving Actions Required**:\n"
                f"• **Step 1**: Call **{emergency_match['phone']}** immediately or proceed to the nearest emergency department.\n"
                f"• **Step 2 (Clinical Action)**: {emergency_match['action']}\n"
                f"• **Step 3 (Safety Advice)**: Do not attempt to drive yourself. Have someone stay with you and keep doors unlocked for paramedics.\n\n"
                f"*(This automated alert was deterministically triggered by clinical emergency red-flags. Do not delay emergency care to continue chatting).* "
            )
            grounding = "EMERGENCY_OVERRIDE"
        else:
            context_summary = []
            if patient_conditions:
                context_summary.append(f"Known conditions: {', '.join(patient_conditions)}")
            if patient_allergies:
                context_summary.append(f"Allergies: {', '.join(patient_allergies)}")
            if patient_meds:
                context_summary.append(f"Current medications: {', '.join(patient_meds)}")
            if is_pregnant:
                context_summary.append("Patient is currently pregnant.")

            context_str = f"\nPatient Context: {'; '.join(context_summary)}" if context_summary else ""
            rl_prompt_addon = f"\n\nREINFORCEMENT LEARNING DIRECTIVE ({rl_action}):\n{rl_directive}"

            llm_messages = [
                {"role": "system", "content": MEDICAL_SAFETY_SYSTEM_PROMPT + context_str + evidence_text + rl_prompt_addon},
                {"role": "user", "content": user_message}
            ]

            # Query Ollama with rich token capacity
            raw_response = await ollama_provider.chat(llm_messages, temperature=0.2, max_tokens=2048)
            grounding = "COMPREHENSIVE_GUIDELINES"

        # 13. Medication Alert Injection
        if med_check_result["has_alerts"]:
            med_warning_text = "\n\n⚠️ **Medication Safety Alert**:\n"
            for alert in med_check_result["alerts"]:
                med_warning_text += f"• **{alert['type']}** ({alert['severity'].upper()}): {alert['message']}\n"
                if "recommendation" in alert:
                    med_warning_text += f"  *Guidance*: {alert['recommendation']}\n"
            raw_response = med_warning_text + "\n" + raw_response

        # 14. Response Safety Validation
        is_valid, safe_response, violations = response_safety_validator.validate(
            raw_response,
            is_emergency=is_emergency
        )

        # 15. Reinforcement Learning Policy Update (Reward Computation)
        if is_emergency:
            reward = 3.5 if is_valid else -5.0
        else:
            reward = 2.5 if is_valid else -5.0
            if len(safe_response) > 500: # Reward for detailed, comprehensive guidelines
                reward += 1.0

        clinical_rl_agent.update_policy(
            triage_tier=triage_level,
            is_emergency=is_emergency,
            user_role=user_role,
            query_category=query_category,
            action=rl_action,
            reward=reward,
            next_triage_tier=triage_level
        )

        # 16. Clinician Escalation Triggering
        needs_escalation = triage_info["needs_escalation"] or is_emergency or med_check_result["has_major_conflict"]
        if needs_escalation and current_user:
            await escalation_service.create_escalation(
                db=db,
                conversation_id=conv_id,
                patient_id=current_user.id,
                reason=emergency_match["category"] if is_emergency else ("Medication Conflict" if med_check_result["has_major_conflict"] else "High Triage Risk"),
                triage_level=triage_level,
                clinical_summary=f"Automated Escalation for message: '{user_message}'. Triage: {triage_label}. ML Risk: {ml_risk_score}."
            )

        # 17. Persist to Database
        msg_id = str(uuid.uuid4())
        try:
            conv_res = await db.execute(select(Conversation).where(Conversation.id == conv_id))
            conv = conv_res.scalars().first()
            if not conv:
                user_id = current_user.id if current_user else None
                if not user_id:
                    default_user = await db.scalar(select(User).limit(1))
                    if default_user:
                        user_id = default_user.id

                conv = Conversation(
                    id=conv_id,
                    user_id=user_id,
                    title=user_message[:45] + ("..." if len(user_message) > 45 else ""),
                    language=detected_lang,
                    created_at=datetime.datetime.utcnow(),
                    updated_at=datetime.datetime.utcnow()
                )
                db.add(conv)
                await db.flush()
            else:
                conv.updated_at = datetime.datetime.utcnow()
                if not conv.title or conv.title == "Health Consultation":
                    conv.title = user_message[:45] + ("..." if len(user_message) > 45 else "")

            user_msg_db = Message(
                conversation_id=conv_id,
                sender_role="user",
                content=user_message,
                triage_level=triage_level,
                is_emergency=is_emergency,
                metadata_json={"language": detected_lang},
                created_at=datetime.datetime.utcnow()
            )
            ai_msg_db = Message(
                conversation_id=conv_id,
                sender_role="assistant",
                content=safe_response,
                triage_level=triage_level,
                is_emergency=is_emergency,
                metadata_json={
                    "triage_label": triage_label,
                    "ml_risk_score": ml_risk_score,
                    "ml_predicted_triage": ml_predicted_triage,
                    "rl_action": rl_action,
                    "rl_expected_q": rl_expected_q,
                    "symptoms": [s.model_dump() for s in extracted_symptoms],
                    "suggested_follow_ups": symptom_result.suggested_follow_up_questions,
                    "medication_alerts": med_check_result["alerts"],
                    "escalation_offered": needs_escalation,
                    "evidence_grounding": grounding
                },
                created_at=datetime.datetime.utcnow()
            )
            db.add(user_msg_db)
            db.add(ai_msg_db)

            # Persist Extracted Symptoms
            for s in extracted_symptoms:
                s_db = SymptomRecord(
                    conversation_id=conv_id,
                    symptom_name=s.name,
                    severity_score=s.severity,
                    duration=s.duration,
                    onset=s.onset,
                    associated_symptoms=s.associated_symptoms
                )
                db.add(s_db)

            await db.commit()
        except Exception as e:
            logger.error(f"Error persisting to DB: {e}")
            await db.rollback()

        return ChatResponse(
            conversation_id=conv_id,
            message_id=msg_id,
            response=safe_response,
            triage_level=triage_level,
            triage_label=triage_label,
            is_emergency=is_emergency,
            emergency_details=emergency_match,
            structured_symptoms=extracted_symptoms,
            differential_considerations=[d.model_dump() for d in differential_list],
            missing_information=symptom_result.missing_critical_info,
            suggested_follow_ups=symptom_result.suggested_follow_up_questions,
            safety_warnings=violations,
            sources=citations,
            medication_alerts=med_check_result["alerts"],
            escalation_offered=needs_escalation,
            evidence_grounding=grounding,
            ml_risk_score=ml_risk_score,
            ml_predicted_triage=ml_predicted_triage,
            rl_action=rl_action,
            rl_expected_q=rl_expected_q,
            ml_explanatory_factors=ml_explanatory_factors
        )

# Singleton instance
orchestrator = MedicalSafetyOrchestrator()
