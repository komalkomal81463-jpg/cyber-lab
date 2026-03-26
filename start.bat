@echo off
echo 🔐 Starting CyberLab...
echo.

:: Backend
echo 📦 Setting up backend...
cd backend

if not exist venv (
    python -m venv venv
)

call venv\Scripts\activate.bat

pip install -r requirements.txt -q

echo 🚀 Starting backend on port 8000...
start "CyberLab Backend" python main.py

cd ..

:: Frontend
echo 📦 Setting up frontend...
cd frontend

echo Installing npm packages...
call npm install --silent

echo 🚀 Starting frontend on port 5173...
start "CyberLab Frontend" npm run dev

cd ..

echo.
echo ✅ CyberLab is running!
echo.
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:8000
echo    API Docs: http://localhost:8000/docs
echo.
echo    Demo login: demo / Demo@123
echo    Admin login: admin / Admin@123
echo.
pause
