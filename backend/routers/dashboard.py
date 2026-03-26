from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, User, UserProgress, Lab, UserAchievement, Achievement
from routers.auth import get_current_user

router = APIRouter()


@router.get("/stats")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    all_progress = db.query(UserProgress).filter(UserProgress.user_id == current_user.id).all()
    completed = [p for p in all_progress if p.status == "completed"]
    in_progress = [p for p in all_progress if p.status == "in_progress"]

    total_labs = db.query(Lab).filter(Lab.is_active == True).count()
    
    # Category breakdown
    cat_stats = {}
    for p in completed:
        lab = db.query(Lab).filter(Lab.id == p.lab_id).first()
        if lab:
            cat_stats[lab.category] = cat_stats.get(lab.category, 0) + 1

    # Recent activity
    recent = sorted(all_progress, key=lambda x: x.started_at or __import__('datetime').datetime.min, reverse=True)[:5]
    recent_labs = []
    for p in recent:
        lab = db.query(Lab).filter(Lab.id == p.lab_id).first()
        if lab:
            recent_labs.append({
                "lab_slug": lab.slug,
                "lab_title": lab.title,
                "status": p.status,
                "progress_pct": p.progress_pct,
                "started_at": p.started_at.isoformat() if p.started_at else None,
            })

    # XP breakdown
    xp_to_next = _xp_to_next_level(current_user.xp)

    # Achievements
    earned = db.query(UserAchievement).filter(UserAchievement.user_id == current_user.id).all()
    achievements = []
    for ua in earned:
        a = db.query(Achievement).filter(Achievement.id == ua.achievement_id).first()
        if a:
            achievements.append({"title": a.title, "icon": a.icon, "earned_at": ua.earned_at.isoformat()})

    return {
        "user": {
            "username": current_user.username,
            "full_name": current_user.full_name,
            "xp": current_user.xp,
            "level": current_user.level,
            "rank": current_user.rank,
            "xp_to_next": xp_to_next,
            "streak": current_user.streak,
        },
        "stats": {
            "total_labs": total_labs,
            "completed": len(completed),
            "in_progress": len(in_progress),
            "completion_rate": round(len(completed) / total_labs * 100, 1) if total_labs > 0 else 0,
        },
        "category_stats": cat_stats,
        "recent_activity": recent_labs,
        "achievements": achievements,
    }


def _xp_to_next_level(xp):
    thresholds = [200, 500, 1000, 2500, 5000, 10000]
    for t in thresholds:
        if xp < t:
            return t - xp
    return 0
