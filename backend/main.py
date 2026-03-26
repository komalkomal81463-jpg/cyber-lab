from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import uvicorn

from database import init_db
from routers import auth, labs, progress, dashboard, terminal

app = FastAPI(
    title="CyberLab API",
    description="Virtual Cybersecurity Lab Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(labs.router, prefix="/api/labs", tags=["Labs"])
app.include_router(progress.router, prefix="/api/progress", tags=["Progress"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(terminal.router, prefix="/api/terminal", tags=["Terminal"])

@app.on_event("startup")
async def startup():
    init_db()

@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
