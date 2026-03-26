#!/bin/bash
# CyberLab - Quick Start Script

echo "🔐 Starting CyberLab..."
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.9+"
    exit 1
fi

# Check Node
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Backend
echo "📦 Setting up backend..."
cd backend

if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null

pip install -r requirements.txt -q

echo "🚀 Starting backend on port 8000..."
python main.py &
BACKEND_PID=$!

cd ..

# Frontend
echo "📦 Setting up frontend..."
cd frontend
npm install --silent
echo "🚀 Starting frontend on port 5173..."
npm run dev &
FRONTEND_PID=$!

cd ..

echo ""
echo "✅ CyberLab is running!"
echo ""
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "   Demo login: demo / Demo@123"
echo "   Admin login: admin / Admin@123"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait and cleanup
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo ''; echo 'Servers stopped.'" EXIT
wait
