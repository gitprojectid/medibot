import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.database.session import engine, Base, AsyncSessionLocal
from backend.app.database.seed_data import seed_database
from backend.app.ai.providers.ollama_provider import ollama_provider

# Enterprise Routers
from backend.app.api.auth_router import router as auth_router
from backend.app.api.chat_router import router as chat_router
from backend.app.api.patient_router import router as patient_router
from backend.app.api.clinician_router import router as clinician_router
from backend.app.api.medication_router import router as medication_router
from backend.app.api.admin_router import router as admin_router
from backend.app.api.doctor_router import router as doctor_router
from backend.app.api.nurse_router import router as nurse_router
from backend.app.api.operations_router import router as operations_router
from backend.app.api.document_router import router as document_router
from backend.app.api.fhir_router import router as fhir_router
from backend.app.api.governance_router import router as governance_router
from backend.app.api.multimodal_router import router as multimodal_router
from backend.app.api.voice_router import router as voice_router
from backend.app.api.research_router import router as research_router
from backend.app.api.adaptive_router import router as adaptive_router
from backend.app.api.billing_router import router as billing_router
from backend.app.api.orders_router import router as orders_router
from backend.app.api.discharge_router import router as discharge_router
from backend.app.api.alerts_router import router as alerts_router
from backend.app.api.pharmacy_router import router as pharmacy_router
from backend.app.api.rapid_response_router import router as rapid_response_router
from backend.app.api.backup_router import router as backup_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("healthcare_ai")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Startup: Create DB Tables
    logger.info("Initializing database schemas...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 2. Seed Demo Data
    async with AsyncSessionLocal() as session:
        await seed_database(session)
        # Check if active model is persisted in DB
        from sqlalchemy import select
        from backend.app.database.models import SystemSetting
        saved_model = await session.execute(select(SystemSetting).where(SystemSetting.key == "active_ollama_model"))
        res = saved_model.scalars().first()
        if res and res.value:
            ollama_provider.set_model(res.value)
            logger.info(f"Restored persisted LLM model: {res.value}")

    # 3. Check Ollama Status
    logger.info(f"Checking Ollama connection at {settings.OLLAMA_BASE_URL}...")
    status = await ollama_provider.health_check()
    if status.get("status") == "connected":
        logger.info(f"Connected to Ollama! Active model: {status.get('active_model')}")
    else:
        logger.warning(f"Ollama not reachable: {status.get('error')}. Using safe fallback mechanisms.")

    yield

    # Shutdown
    await engine.dispose()
    logger.info("Application shutdown complete.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Safety-First Healthcare AI Conversational Platform powered by local Ollama LLMs.",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(chat_router, prefix=settings.API_PREFIX)
app.include_router(patient_router, prefix=settings.API_PREFIX)
app.include_router(clinician_router, prefix=settings.API_PREFIX)
app.include_router(medication_router, prefix=settings.API_PREFIX)
app.include_router(admin_router, prefix=settings.API_PREFIX)
app.include_router(doctor_router, prefix=settings.API_PREFIX)
app.include_router(nurse_router, prefix=settings.API_PREFIX)
app.include_router(operations_router, prefix=settings.API_PREFIX)
app.include_router(document_router, prefix=settings.API_PREFIX)
app.include_router(fhir_router, prefix=settings.API_PREFIX)
app.include_router(governance_router, prefix=settings.API_PREFIX)
app.include_router(multimodal_router, prefix=settings.API_PREFIX)
app.include_router(voice_router, prefix=settings.API_PREFIX)
app.include_router(research_router, prefix=settings.API_PREFIX)
app.include_router(adaptive_router, prefix=settings.API_PREFIX)
app.include_router(billing_router, prefix=settings.API_PREFIX)
app.include_router(orders_router, prefix=settings.API_PREFIX)
app.include_router(discharge_router, prefix=settings.API_PREFIX)
app.include_router(alerts_router, prefix=settings.API_PREFIX)
app.include_router(pharmacy_router, prefix=settings.API_PREFIX)
app.include_router(rapid_response_router, prefix=settings.API_PREFIX)
app.include_router(backup_router, prefix=settings.API_PREFIX)

@app.get("/api/health")
async def health_check():
    ollama_info = await ollama_provider.health_check()
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "ollama": ollama_info
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
