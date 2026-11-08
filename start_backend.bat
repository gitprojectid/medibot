@echo off
echo ========================================================
echo Starting Healthcare AI Assistant - FastAPI Backend Server
echo ========================================================
cd /d "%~dp0"
py -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
pause
