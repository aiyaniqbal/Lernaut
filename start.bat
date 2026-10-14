@echo off
setlocal
cd /d "%~dp0"

echo.
echo  ==========================================
echo         Lernaut — AI Learning Platform
echo  ==========================================
echo.
echo Starting Hindi TTS on port 8001...
echo Starting FastAPI backend on port 8000...
echo Starting Next.js frontend on port 3000...
echo.

if exist "%~dp0.venv\Scripts\python.exe" (
  start "Lernaut TTS - 8001" /D "%~dp0apps\api" cmd /k "..\..\.venv\Scripts\python.exe -m uvicorn tts_server:app --host 127.0.0.1 --port 8001"
  start "Lernaut Backend - 8000" /D "%~dp0apps\api" cmd /k "..\..\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000"
) else (
  start "Lernaut TTS - 8001" /D "%~dp0apps\api" cmd /k "python -m uvicorn tts_server:app --host 127.0.0.1 --port 8001"
  start "Lernaut Backend - 8000" /D "%~dp0apps\api" cmd /k "python -m uvicorn main:app --host 127.0.0.1 --port 8000"
)

start "Lernaut Frontend - 3000" /D "%~dp0apps\web" cmd /k "npm run dev"

echo Three service windows have been started.
echo Keep all three running during the demo.
endlocal
