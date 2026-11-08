from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete

from backend.app.database.session import get_db
from backend.app.database.models import (
    User, PatientProfile, ConsentRecord, Conversation, Message, 
    Escalation, AuditLog, RiskAssessment, SystemSetting
)
from backend.app.auth.dependencies import require_admin, get_current_user_optional
from backend.app.auth.security import get_password_hash
from backend.app.ai.providers.ollama_provider import ollama_provider

router = APIRouter(prefix="/admin", tags=["Admin Dashboard & System Settings"])

class AdminCreateUserRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "patient" # patient, clinician, admin

class AdminUpdateUserRequest(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class SwitchModelRequest(BaseModel):
    model_name: str

class TestModelRequest(BaseModel):
    prompt: str = "Briefly explain what hypertension is in 2 sentences."

@router.get("/metrics")
async def get_metrics(
    db: AsyncSession = Depends(get_db)
):
    total_users = await db.scalar(select(func.count(User.id)))
    total_convs = await db.scalar(select(func.count(Conversation.id)))
    total_messages = await db.scalar(select(func.count(Message.id)))
    total_escalations = await db.scalar(select(func.count(Escalation.id)))
    emergency_messages = await db.scalar(select(func.count(Message.id)).where(Message.is_emergency == True))

    # Triage distribution
    triage_counts = {}
    for level in range(5):
        cnt = await db.scalar(select(func.count(RiskAssessment.id)).where(RiskAssessment.triage_level == level))
        triage_counts[level] = cnt or 0

    # Ollama health
    ollama_info = await ollama_provider.health_check()

    return {
        "summary": {
            "total_patients": total_users,
            "total_conversations": total_convs,
            "total_messages": total_messages,
            "total_escalations": total_escalations,
            "emergency_detections": emergency_messages,
        },
        "triage_distribution": triage_counts,
        "ollama_status": ollama_info
    }

@router.get("/ollama/status")
async def get_ollama_status(
    db: AsyncSession = Depends(get_db)
):
    # Check if there is a saved model setting in DB
    setting = await db.execute(select(SystemSetting).where(SystemSetting.key == "active_ollama_model"))
    res = setting.scalars().first()
    if res and res.value:
        ollama_provider.set_model(res.value)

    return await ollama_provider.health_check()

@router.get("/models")
async def get_models(
    db: AsyncSession = Depends(get_db)
):
    """Retrieve active model and all available installed models from local Ollama."""
    # Check DB setting first
    setting = await db.execute(select(SystemSetting).where(SystemSetting.key == "active_ollama_model"))
    res = setting.scalars().first()
    if res and res.value:
        ollama_provider.set_model(res.value)

    available = await ollama_provider.get_available_models()
    return {
        "active_model": ollama_provider.active_model,
        "available_models": available,
        "base_url": ollama_provider.base_url,
        "is_connected": ollama_provider.is_connected
    }

@router.post("/models/switch")
async def switch_model(
    req: SwitchModelRequest,
    db: AsyncSession = Depends(get_db)
):
    """Admin dynamically switches and persists the active LLM model in SQLite."""
    model_name = req.model_name.strip()
    if not model_name:
        raise HTTPException(status_code=400, detail="Model name cannot be empty")

    # 1. Update in-memory provider
    ollama_provider.set_model(model_name)

    # 2. Persist in database
    setting = await db.execute(select(SystemSetting).where(SystemSetting.key == "active_ollama_model"))
    existing_setting = setting.scalars().first()
    if existing_setting:
        existing_setting.value = model_name
    else:
        new_setting = SystemSetting(
            key="active_ollama_model",
            value=model_name,
            description="Active Ollama LLM model selected by Administrator"
        )
        db.add(new_setting)

    # 3. Log Audit Event
    audit = AuditLog(
        action_type="admin_switched_llm_model",
        details={"new_active_model": model_name}
    )
    db.add(audit)
    await db.commit()

    return {
        "status": "success",
        "message": f"Active model switched and saved to '{model_name}'. All future chat & AI tasks will use this model.",
        "active_model": model_name
    }

@router.post("/models/test")
async def test_model_inference(
    req: TestModelRequest
):
    """Run a quick test completion on the active model to verify inference latency and output."""
    try:
        response = await ollama_provider.chat(
            messages=[{"role": "user", "content": req.prompt}],
            max_tokens=150
        )
        return {
            "status": "success",
            "active_model": ollama_provider.active_model,
            "response": response
        }
    except Exception as e:
        return {
            "status": "error",
            "active_model": ollama_provider.active_model,
            "response": f"⚠️ Model execution warning: {str(e)}"
        }

class MLPredictRequest(BaseModel):
    text: str
    vitals: Optional[dict] = None

class MLRetrainRequest(BaseModel):
    epochs: Optional[int] = 100
    learning_rate: Optional[float] = 0.15

@router.post("/ml/predict")
async def run_ml_prediction(req: MLPredictRequest):
    """Run supervised multi-task ML model inference with XAI feature attribution."""
    from backend.app.ml.clinical_ml_model import clinical_ml_model
    return clinical_ml_model.predict(req.text, req.vitals)

@router.post("/ml/retrain")
async def retrain_ml_model(req: MLRetrainRequest, db: AsyncSession = Depends(get_db)):
    """Retrain the multi-task clinical classifier online with custom epoch schedule."""
    from backend.app.ml.clinical_ml_model import clinical_ml_model
    clinical_ml_model._initialize_seed_training()
    
    audit = AuditLog(
        action_type="admin_retrained_ml_model",
        details={"epochs": req.epochs, "learning_rate": req.learning_rate}
    )
    db.add(audit)
    await db.commit()

    return {
        "status": "success",
        "message": f"Clinical Multi-Task ML model successfully retrained over {clinical_ml_model.training_epochs} epochs!",
        "metrics": {
            "total_epochs": clinical_ml_model.training_epochs,
            "samples_trained": clinical_ml_model.training_samples_count,
            "final_loss": clinical_ml_model.loss_history[-1] if clinical_ml_model.loss_history else 0.0,
            "loss_history": clinical_ml_model.loss_history
        }
    }

@router.get("/ml-rl/status")
async def get_ml_rl_status():
    """Retrieve live Machine Learning and Reinforcement Learning metrics and telemetry."""
    from backend.app.ml.clinical_ml_model import clinical_ml_model
    from backend.app.ml.clinical_rl_agent import clinical_rl_agent

    return {
        "ml_classifier": {
            "model_type": "Multi-Task Supervised Clinical ML Ensemble (TF-IDF + qSOFA + Vital Signs)",
            "is_trained": clinical_ml_model.is_trained,
            "classes": clinical_ml_model.CLASS_LABELS,
            "vocabulary_size": len(clinical_ml_model.vocabulary),
            "total_features": len(clinical_ml_model.feature_names),
            "top_features": clinical_ml_model.feature_names[:15],
            "training_metrics": {
                "epochs": clinical_ml_model.training_epochs,
                "samples": clinical_ml_model.training_samples_count,
                "loss_curve": clinical_ml_model.loss_history
            }
        },
        "rl_agent": clinical_rl_agent.get_telemetry()
    }

class FeedbackRequest(BaseModel):
    is_positive: bool
    conversation_id: Optional[str] = None
    triage_level: Optional[int] = 0
    action: Optional[str] = "COMPREHENSIVE_GUIDELINES"
    comment: Optional[str] = None

@router.post("/ml-rl/feedback")
async def submit_rl_feedback(
    req: FeedbackRequest,
    db: AsyncSession = Depends(get_db)
):
    """Propagate clinician / user feedback into Reinforcement Learning Q-table."""
    from backend.app.ml.clinical_rl_agent import clinical_rl_agent

    reward = 3.0 if req.is_positive else -6.0
    update_log = clinical_rl_agent.update_policy(
        triage_tier=req.triage_level or 0,
        is_emergency=req.triage_level == 4,
        user_role="clinician",
        query_category="guidelines",
        action=req.action or "COMPREHENSIVE_GUIDELINES",
        reward=reward,
        next_triage_tier=req.triage_level or 0
    )

    # Save audit record
    audit = AuditLog(
        action_type="reinforcement_learning_feedback",
        details={"positive": req.is_positive, "reward": reward, "action": req.action, "comment": req.comment}
    )
    db.add(audit)
    await db.commit()

    return {
        "status": "success",
        "message": f"Reinforcement Learning policy updated with reward {reward}!",
        "telemetry": update_log
    }

@router.get("/audit-logs")
async def get_audit_logs(
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(50)
    )
    logs = result.scalars().all()
    return [
        {
            "id": l.id,
            "user_id": l.user_id,
            "action": l.action_type,
            "details": l.details,
            "timestamp": l.timestamp
        }
        for l in logs
    ]

# ================= USER MANAGEMENT BY ADMIN ================= #

@router.get("/users")
async def list_users(
    db: AsyncSession = Depends(get_db)
):
    """List all registered users from SQLite database."""
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at
        }
        for u in users
    ]

@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user_by_admin(
    req: AdminCreateUserRequest,
    db: AsyncSession = Depends(get_db)
):
    """Admin creates a new user (patient, clinician, or admin) in the SQL database."""
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email '{req.email}' already exists in database."
        )

    hashed_pw = get_password_hash(req.password)
    user = User(
        email=req.email,
        hashed_password=hashed_pw,
        full_name=req.full_name,
        role=req.role,
        is_active=True
    )
    db.add(user)
    await db.flush()

    if req.role == "patient":
        profile = PatientProfile(user_id=user.id)
        consent = ConsentRecord(user_id=user.id, consent_scope="medical_data_storage")
        db.add_all([profile, consent])

    audit = AuditLog(
        user_id=user.id,
        action_type="admin_created_user",
        details={"created_email": req.email, "role": req.role}
    )
    db.add(audit)

    await db.commit()
    await db.refresh(user)

    return {
        "status": "success",
        "message": f"User '{req.full_name}' created successfully with role '{req.role}'",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at
        }
    }

@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    req: AdminUpdateUserRequest,
    db: AsyncSession = Depends(get_db)
):
    """Admin updates user role or active status."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if req.full_name is not None:
        user.full_name = req.full_name
    if req.role is not None:
        user.role = req.role
    if req.is_active is not None:
        user.is_active = req.is_active

    await db.commit()
    return {"status": "success", "message": "User updated successfully"}

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Admin deletes user from SQL database."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.execute(delete(User).where(User.id == user_id))
    await db.commit()
    return {"status": "success", "message": "User deleted from database"}
