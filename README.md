# 🔐 CyberLab — Virtual Cybersecurity Training Platform

A full-stack virtual cybersecurity lab platform similar to TryHackMe. Features simulated environments for ethical hacking practice with SQL injection, XSS, network scanning, cryptography, and more.

---

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- npm or yarn

---

## ⚙️ Setup & Run

### 1. Clone / Extract

```bash
unzip cyberlab.zip
cd cyberlab
```

---

### 2. Backend Setup

```bash
cd backend

# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate        # Linux/Mac
# OR
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Run the backend server
python main.py
```

The API will start at: **http://localhost:8000**

API docs available at: **http://localhost:8000/docs**

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The app will open at: **http://localhost:5173**

---

## 🔑 Demo Credentials

| Username | Password | Role |
|----------|----------|------|
| `demo`   | `Demo@123` | Student |
| `admin`  | `Admin@123` | Admin |

---

## 📁 Project Structure

```
cyberlab/
├── backend/
│   ├── main.py              # FastAPI app entry
│   ├── database.py          # SQLite models + seed data
│   ├── requirements.txt
│   └── routers/
│       ├── auth.py          # JWT authentication
│       ├── labs.py          # Lab CRUD + flag submission
│       ├── progress.py      # User progress tracking
│       ├── dashboard.py     # Stats & analytics
│       └── terminal.py      # Simulated terminal engine
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── pages/
        │   ├── AuthPage.jsx       # Login/Register
        │   ├── DashboardPage.jsx  # Stats & progress
        │   ├── LabsPage.jsx       # Lab catalog
        │   ├── LabPage.jsx        # Lab environment + terminal
        │   ├── LeaderboardPage.jsx
        │   └── ProfilePage.jsx
        ├── components/
        │   ├── Layout.jsx         # Sidebar navigation
        │   └── Terminal.jsx       # Interactive terminal
        ├── store/
        │   └── authStore.js       # Zustand auth state
        └── utils/
            └── api.js             # Axios instance
```

---

## 🧪 Available Labs

### 🌐 Web Exploitation
| Lab | Difficulty | XP |
|-----|-----------|-----|
| SQL Injection: Basics | Beginner | 150 |
| SQL Injection: UNION Attacks | Intermediate | 250 |
| Cross-Site Scripting (XSS) | Beginner | 150 |
| OS Command Injection | Intermediate | 200 |

### 🔌 Network
| Lab | Difficulty | XP |
|-----|-----------|-----|
| Network Scanning with Nmap | Beginner | 120 |
| Packet Analysis with Wireshark | Beginner | 130 |

### 🔐 Cryptography
| Lab | Difficulty | XP |
|-----|-----------|-----|
| Classical Ciphers: Caesar & ROT13 | Beginner | 100 |
| Password Hash Cracking | Intermediate | 200 |

### 🔍 Forensics
| Lab | Difficulty | XP |
|-----|-----------|-----|
| Steganography Basics | Beginner | 120 |

---

## 🛠️ Simulated Tools

The terminal simulates these real security tools:

| Tool | Description |
|------|-------------|
| `nmap` | Network scanner with port/service/OS detection |
| `sqlmap` | SQL injection automation |
| `hashcat` | GPU-accelerated password cracker |
| `john` | John the Ripper password cracker |
| `curl` | HTTP request tool with injection simulation |
| `steghide` | Steganography extraction |
| `binwalk` | Firmware analysis / file carving |
| `exiftool` | Metadata extraction |
| `burpsuite` | Web proxy simulation |
| `python3` | Python interpreter (limited) |
| `base64` | Encode/decode |
| `rot13` | ROT13 cipher |
| `strings` | Extract readable strings |
| `nc` | Netcat |
| `wireshark` | Packet analysis |

---

## 🏗️ Production Deployment

### Backend (Python)

```bash
# Use gunicorn for production
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend (Build)

```bash
cd frontend
npm run build
# Serve the dist/ folder with nginx or any static server
```

### Environment Variables

Create `backend/.env`:
```env
SECRET_KEY=your-super-secret-key-here-change-this
DATABASE_URL=sqlite:///./cyberlab.db
```

---

## 🔒 Security Notes

- All lab environments are **fully simulated** — no real exploitation occurs
- JWT tokens expire after 24 hours
- Passwords are hashed with bcrypt
- SQLite database stored at `backend/cyberlab.db`
- Change `SECRET_KEY` in production!

---

## ✨ Features

- 🔐 JWT authentication with login/register
- 📊 Personal dashboard with XP tracking & charts
- 🧪 9 hands-on security labs across 4 categories
- 💻 Interactive terminal with 15+ simulated tools
- 📋 Task completion tracking with XP rewards
- 💡 Progressive hint system
- 🚩 CTF-style flag submission
- 🏆 Leaderboard with XP rankings
- 👤 Profile page with progress history
- 📱 Responsive dark theme UI

---

## 📝 Adding New Labs

1. Edit `backend/database.py` and add a new `Lab()` entry to the `_seed_data()` function
2. Add the lab environment simulation in `backend/routers/terminal.py` in `LAB_ENVIRONMENTS`
3. Delete `cyberlab.db` and restart the backend to re-seed

---

Built with FastAPI + React + Vite + SQLite
