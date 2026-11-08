import json
import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func, desc

from backend.app.database.session import get_db
from backend.app.database.models import User, Conversation, Message
from backend.app.auth.dependencies import get_current_user_optional
from backend.app.ai.schemas.chat_schemas import ChatRequest, ChatResponse
from backend.app.orchestrator import orchestrator

router = APIRouter(prefix="/chat", tags=["AI Chat & Session Management"])

@router.post("", response_model=ChatResponse)
async def chat_endpoint(
    req: ChatRequest,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user_optional)
):
    """
    Main orchestrated healthcare chat endpoint.
    Applies emergency detection, symptom extraction, medication check, RAG, and safety validation.
    Persists to session-based conversation history in SQLite.
    """
    return await orchestrator.process_chat(req, db, user)

@router.get("/conversations")
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user_optional)
):
    """
    Retrieve all conversation sessions sorted by most recent activity.
    """
    query = select(Conversation).order_by(desc(Conversation.updated_at)).limit(50)
    if user and user.role == "patient":
        query = select(Conversation).where(Conversation.user_id == user.id).order_by(desc(Conversation.updated_at)).limit(50)
    
    result = await db.execute(query)
    conversations = result.scalars().all()

    items = []
    for c in conversations:
        # Count messages
        msg_count = await db.scalar(
            select(func.count(Message.id)).where(Message.conversation_id == c.id)
        )
        # Fetch last message
        last_msg_res = await db.execute(
            select(Message).where(Message.conversation_id == c.id).order_by(desc(Message.created_at)).limit(1)
        )
        last_msg = last_msg_res.scalars().first()

        items.append({
            "id": c.id,
            "title": c.title or "Health Consultation",
            "message_count": msg_count or 0,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "updated_at": c.updated_at.isoformat() if c.updated_at else None,
            "last_message": last_msg.content[:60] + "..." if last_msg and len(last_msg.content) > 60 else (last_msg.content if last_msg else ""),
            "last_role": last_msg.sender_role if last_msg else "user",
            "triage_level": last_msg.triage_level if last_msg else 0,
            "is_emergency": last_msg.is_emergency if last_msg else False
        })

    return items

@router.get("/conversations/{conversation_id}")
async def get_conversation_history(
    conversation_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve the complete message history for a specific conversation session.
    """
    conv_res = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conv = conv_res.scalars().first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation session not found")

    msg_res = await db.execute(
        select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at.asc())
    )
    messages = msg_res.scalars().all()

    formatted_messages = []
    for m in messages:
        meta = m.metadata_json or {}
        formatted_messages.append({
            "id": m.id,
            "role": m.sender_role,
            "content": m.content,
            "triage_level": m.triage_level,
            "triage_label": meta.get("triage_label", "Standard"),
            "is_emergency": m.is_emergency,
            "ml_risk_score": meta.get("ml_risk_score", 0.0),
            "rl_action": meta.get("rl_action", "COMPREHENSIVE_GUIDELINES"),
            "symptoms": meta.get("symptoms", []),
            "suggested_follow_ups": meta.get("suggested_follow_ups", []),
            "medication_alerts": meta.get("medication_alerts", []),
            "timestamp": m.created_at.strftime("%I:%M %p") if m.created_at else datetime.datetime.utcnow().strftime("%I:%M %p")
        })

    return {
        "id": conv.id,
        "title": conv.title,
        "created_at": conv.created_at.isoformat() if conv.created_at else None,
        "updated_at": conv.updated_at.isoformat() if conv.updated_at else None,
        "messages": formatted_messages
    }

@router.post("/conversations")
async def create_new_conversation(
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user_optional)
):
    """
    Create a new empty conversation session.
    """
    user_id = user.id if user else None
    if not user_id:
        default_user = await db.scalar(select(User).limit(1))
        if default_user:
            user_id = default_user.id

    new_id = str(uuid.uuid4())
    conv = Conversation(
        id=new_id,
        user_id=user_id,
        title="New Health Consultation",
        created_at=datetime.datetime.utcnow(),
        updated_at=datetime.datetime.utcnow()
    )
    db.add(conv)
    await db.commit()

    return {
        "id": conv.id,
        "title": conv.title,
        "created_at": conv.created_at.isoformat(),
        "messages": []
    }

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a conversation session and all its messages.
    """
    await db.execute(delete(Message).where(Message.conversation_id == conversation_id))
    await db.execute(delete(Conversation).where(Conversation.id == conversation_id))
    await db.commit()

    return {"status": "success", "message": f"Conversation session {conversation_id} deleted successfully."}
