# Healthcare AI Safety-First Conversational Assistant

A production-quality, safety-controlled **Healthcare AI Platform** powered by local Ollama (`qwen2.5-coder:3b` / `qwen3:8b`) surrounded by deterministic clinical safety controls, medical evidence retrieval (RAG), pharmacology interaction checking, 5-tier triage classification, clinician escalation queues, and a modern responsive web dashboard.

---

## 🏥 Key Architectural Principles

1. **Deterministic Emergency Override**: High-risk symptoms (cardiovascular distress, stroke FAST criteria, severe respiratory distress, anaphylaxis, heavy bleeding, crisis) bypass normal LLM conversation and trigger instant emergency escalation with direct emergency helpline actions.
2. **Response Safety Validation**: Every response is filtered before reaching the user to prevent definitive diagnoses, unauthorized dosage prescriptions, and false reassurance.
3. **Evidence-Grounded RAG**: Retrieved passages from authoritative guidelines (AHA, WHO, CDC, NHS) are injected and cited with complete provenance.
4. **Offline-First Local AI**: Connects to local Ollama on `http://localhost:11434` and local SQLite/PostgreSQL databases with no cloud dependencies required.
5. **Multilingual Clinical Normalization**: Normalizes medical terminology across English, Tamil, Hindi, Telugu, Malayalam, and Kannada.

---

## 🛠️ Technology Stack

- **Backend**: FastAPI, Pydantic v2, SQLAlchemy (Async), SQLite/PostgreSQL, Python-Jose (JWT), Passlib (Bcrypt), HTTPX.
- **Local AI Provider**: Ollama (`qwen2.5-coder:3b`, `qwen3:8b`).
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Axios.
- **Testing**: Pytest & Pytest-Asyncio (100% test pass rate across safety engines, triage, and live Ollama pipelines).

---

## 🚀 Quick Start (Local Setup)

### 1. Ensure Ollama is Running
Make sure Ollama is installed and running on `http://localhost:11434` with the model pulled:
```bash
ollama run qwen2.5-coder:3b
```

### 2. Install Backend Dependencies
```bash
py -m pip install -r backend/requirements.txt
```

### 3. Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### 4. Start the Application
You can run both servers automatically using `start_system.bat` or individually:

**Backend Server (Port 8000)**:
```bash
py -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend Server (Port 5173)**:
```bash
cd frontend
npm run dev
```

Open your browser at **`http://localhost:5173`** to access the web application or **`http://localhost:8000/docs`** for the OpenAPI Swagger documentation.

---

## 🧪 Running the Automated Safety Test Suite

Execute the 20-test safety and integration test suite using `py`:
```bash
py -m pytest backend/tests/ -v
```

### Test Coverage Highlights:
- `test_cardiovascular_emergency`: Verified instant Level 4 Emergency classification on chest pain & radiation.
- `test_stroke_emergency`: Verified FAST criteria detection (facial droop, speech difficulty).
- `test_anaphylaxis_emergency`: Verified airway/allergy red-flag emergency detection.
- `test_mental_health_crisis`: Verified 988 crisis routing.
- `test_drug_drug_interaction`: Verified Warfarin + Aspirin hemorrhage conflict detection.
- `test_allergy_cross_reactivity`: Verified Penicillin allergy vs Amoxicillin cross-reaction detection.
- `test_pregnancy_contraindication`: Verified teratogen drug protection (Lisinopril in pregnancy).
- `test_definitive_diagnosis_blocking`: Verified conversion of definitive claims to differential possibilities.
- `test_e2e_prompt_injection_resistance`: Verified resistance to "ignore medical rules" jailbreaks.

---

## 👥 Demo Roles & Accounts

The database is pre-seeded with sample user accounts for testing:
- **Patient View**: `Alex Johnson` (`patient@healthcare.ai` / `password123`) — Chat with AI, track vitals, log medications, and request clinician escalation.
- **Clinician Portal**: `Dr. Sarah Mitchell, MD` (`doctor@healthcare.ai` / `password123`) — Review escalated cases, inspect patient vitals, generate AI clinical summaries (SOAP format), and record notes.
- **Administrator**: `System Administrator` (`admin@healthcare.ai` / `password123`) — View real-time Ollama status, triage distribution analytics, and security audit logs.

*(You can also easily switch between roles using the role dropdown in the top-right header of the web interface).*
