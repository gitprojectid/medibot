@echo off
echo ========================================================
echo Starting Healthcare AI Safety Platform (Backend + Frontend)
echo ========================================================

start "Healthcare AI - Backend Server (Port 8000)" cmd /k "cd /d %~dp0 && py -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 3 /nobreak >nul
start "Healthcare AI - Web Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm.cmd run dev"

echo.
echo Both servers are launching:
echo  - Backend API: http://localhost:8000/docs
echo  - Frontend UI: http://localhost:5173
echo.
pause
