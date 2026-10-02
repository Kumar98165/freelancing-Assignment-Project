@echo off
TITLE TzSuperPOS 1-Click System Launcher
color 0A
echo ============================================================
echo   TzSuperPOS - Supermarket Management System Launcher
echo ============================================================
echo.

echo [1/4] Checking Python & Backend Dependencies...
cd /d "%~dp0backend"
pip install -r requirements.txt

echo.
echo [2/4] Initializing Database & Seed Data...
python seed.py

echo.
echo [3/4] Checking Frontend Dependencies...
cd /d "%~dp0frontend"
if not exist node_modules (
    echo Installing node modules...
    npm install
)

echo.
echo ============================================================
echo   Starting Services Concurrent Mode...
echo   - Backend Flask API : http://127.0.0.1:5000
echo   - Frontend Vite UI  : http://localhost:5173
echo ============================================================
echo.

cd /d "%~dp0"
python run_project.py

pause
