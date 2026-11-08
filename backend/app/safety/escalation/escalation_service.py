import datetime
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.database.models import Escalation

class EscalationService:
    """
    Manages dispatching clinical escalations to the clinician dashboard,
    tagging risk urgency, and recording summary for doctor review.
    """

    async def create_escalation(
        self,
        db: AsyncSession,
        conversation_id: str,
        patient_id: str,
        reason: str,
        triage_level: int,
        clinical_summary: str
    ) -> Escalation:
        escalation = Escalation(
            conversation_id=conversation_id,
            patient_id=patient_id,
            reason=reason,
            triage_level=triage_level,
            status="pending",
            clinical_summary=clinical_summary,
            created_at=datetime.datetime.utcnow()
        )
        db.add(escalation)
        await db.commit()
        await db.refresh(escalation)
        return escalation

escalation_service = EscalationService()
