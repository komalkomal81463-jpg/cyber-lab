from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db, Lab, UserProgress, User
from routers.auth import get_current_user

router = APIRouter()


@router.get("/")
def list_labs(
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Lab).filter(Lab.is_active == True)
    if category:
        query = query.filter(Lab.category == category)
    if difficulty:
        query = query.filter(Lab.difficulty == difficulty)
    
    labs = query.order_by(Lab.order_index).all()
    
    # Enrich with user progress
    result = []
    for lab in labs:
        progress = db.query(UserProgress).filter(
            UserProgress.user_id == current_user.id,
            UserProgress.lab_id == lab.id
        ).first()
        
        lab_dict = _lab_summary(lab)
        lab_dict["user_progress"] = {
            "status": progress.status if progress else "not_started",
            "progress_pct": progress.progress_pct if progress else 0,
        }
        result.append(lab_dict)
    
    return result


@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    cats = db.query(Lab.category).distinct().all()
    return [c[0] for c in cats if c[0]]


@router.get("/{slug}")
def get_lab(
    slug: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lab = db.query(Lab).filter(Lab.slug == slug).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    
    progress = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.lab_id == lab.id
    ).first()
    
    data = _lab_full(lab)
    data["user_progress"] = _progress_dict(progress) if progress else None
    return data


@router.post("/{slug}/start")
def start_lab(
    slug: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lab = db.query(Lab).filter(Lab.slug == slug).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    
    from datetime import datetime
    progress = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.lab_id == lab.id
    ).first()
    
    if not progress:
        progress = UserProgress(
            user_id=current_user.id,
            lab_id=lab.id,
            status="in_progress",
            started_at=datetime.utcnow(),
            attempts=1
        )
        db.add(progress)
    else:
        if progress.status == "not_started":
            progress.status = "in_progress"
            progress.started_at = datetime.utcnow()
        progress.attempts += 1
    
    db.commit()
    return {"message": "Lab started", "progress": _progress_dict(progress)}


@router.post("/{slug}/complete-task")
def complete_task(
    slug: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lab = db.query(Lab).filter(Lab.slug == slug).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    
    task_id = payload.get("task_id")
    progress = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.lab_id == lab.id
    ).first()
    
    if not progress:
        raise HTTPException(status_code=400, detail="Lab not started")
    
    completed = list(progress.completed_tasks or [])
    if task_id not in completed:
        completed.append(task_id)
        progress.completed_tasks = completed
        
        total_tasks = len(lab.tasks or [])
        progress.progress_pct = (len(completed) / total_tasks * 100) if total_tasks > 0 else 0
        
        # Award XP for task
        task = next((t for t in (lab.tasks or []) if t["id"] == task_id), None)
        if task:
            current_user.xp += task.get("xp", 0)
            _update_level(current_user)
        
        db.commit()
    
    return {"completed_tasks": completed, "progress_pct": progress.progress_pct}


@router.post("/{slug}/submit-flag")
def submit_flag(
    slug: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lab = db.query(Lab).filter(Lab.slug == slug).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    
    submitted_flag = payload.get("flag", "").strip()
    
    if submitted_flag != lab.flag:
        return {"success": False, "message": "Incorrect flag. Keep trying!"}
    
    from datetime import datetime
    progress = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.lab_id == lab.id
    ).first()
    
    if progress and progress.status != "completed":
        progress.status = "completed"
        progress.progress_pct = 100.0
        progress.completed_at = datetime.utcnow()
        current_user.xp += lab.xp_reward
        _update_level(current_user)
        db.commit()
        return {"success": True, "message": "🎉 Correct! Lab completed!", "xp_earned": lab.xp_reward}
    
    return {"success": True, "message": "Already completed!"}


@router.post("/{slug}/use-hint")
def use_hint(
    slug: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lab = db.query(Lab).filter(Lab.slug == slug).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    
    hint_index = payload.get("hint_index", 0)
    hints = lab.hints or []
    
    if hint_index >= len(hints):
        raise HTTPException(status_code=400, detail="No more hints available")
    
    progress = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.lab_id == lab.id
    ).first()
    if progress:
        progress.hints_used = (progress.hints_used or 0) + 1
        db.commit()
    
    return {"hint": hints[hint_index], "hint_index": hint_index}


def _update_level(user: User):
    xp = user.xp
    if xp >= 10000:
        user.level = 10
        user.rank = "Elite Hacker"
    elif xp >= 5000:
        user.level = 8
        user.rank = "Advanced Hacker"
    elif xp >= 2500:
        user.level = 6
        user.rank = "Intermediate"
    elif xp >= 1000:
        user.level = 4
        user.rank = "Skilled"
    elif xp >= 500:
        user.level = 3
        user.rank = "Apprentice"
    elif xp >= 200:
        user.level = 2
        user.rank = "Script Kiddie"
    else:
        user.level = 1
        user.rank = "Newbie"


def _lab_summary(lab: Lab) -> dict:
    return {
        "id": lab.id,
        "slug": lab.slug,
        "title": lab.title,
        "description": lab.description,
        "category": lab.category,
        "difficulty": lab.difficulty,
        "xp_reward": lab.xp_reward,
        "estimated_time": lab.estimated_time,
        "tags": lab.tags,
        "prerequisites": lab.prerequisites,
        "tools": lab.tools,
    }


def _lab_full(lab: Lab) -> dict:
    d = _lab_summary(lab)
    d.update({
        "instructions": lab.instructions,
        "hints": lab.hints,
        "tasks": lab.tasks,
        "flag": None,  # Never expose flag directly
    })
    return d


def _progress_dict(p) -> dict:
    if not p:
        return None
    return {
        "status": p.status,
        "progress_pct": p.progress_pct,
        "completed_tasks": p.completed_tasks,
        "hints_used": p.hints_used,
        "attempts": p.attempts,
        "time_spent": p.time_spent,
        "started_at": p.started_at.isoformat() if p.started_at else None,
        "completed_at": p.completed_at.isoformat() if p.completed_at else None,
    }
