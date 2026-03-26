from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, User, UserProgress, Lab
from routers.auth import get_current_user

router = APIRouter()


@router.get("/")
def get_all_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    progress_list = db.query(UserProgress).filter(UserProgress.user_id == current_user.id).all()
    result = []
    for p in progress_list:
        lab = db.query(Lab).filter(Lab.id == p.lab_id).first()
        result.append({
            "lab_id": p.lab_id,
            "lab_slug": lab.slug if lab else None,
            "lab_title": lab.title if lab else None,
            "status": p.status,
            "progress_pct": p.progress_pct,
            "hints_used": p.hints_used,
            "attempts": p.attempts,
            "completed_tasks": p.completed_tasks,
            "started_at": p.started_at.isoformat() if p.started_at else None,
            "completed_at": p.completed_at.isoformat() if p.completed_at else None,
        })
    return result


@router.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    users = db.query(User).filter(User.is_active == True).order_by(User.xp.desc()).limit(20).all()
    return [
        {
            "rank": i + 1,
            "username": u.username,
            "full_name": u.full_name,
            "xp": u.xp,
            "level": u.level,
            "rank_title": u.rank,
            "is_me": u.id == current_user.id,
        }
        for i, u in enumerate(users)
    ]
