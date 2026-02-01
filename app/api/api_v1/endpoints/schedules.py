from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json

from app.api import deps
from app.models.schedule import ContainerSchedule
from app.schemas.schedule import Schedule, ScheduleCreate
from app.services.scheduler_service import scheduler_service

router = APIRouter()

@router.get("/", response_model=List[Schedule])
def read_schedules(db: Session = Depends(deps.get_db), skip: int = 0, limit: int = 100, current_user: str = Depends(deps.get_current_user)):
    schedules = db.query(ContainerSchedule).offset(skip).limit(limit).all()
    return schedules

@router.post("/", response_model=Schedule)
def create_schedule(
    schedule_in: ScheduleCreate,
    db: Session = Depends(deps.get_db),
    current_user: str = Depends(deps.get_current_user)
):
    data = schedule_in.dict()
    # Serialize container_ids list to JSON string
    if 'container_ids' in data and isinstance(data['container_ids'], list):
        data['container_ids'] = json.dumps(data['container_ids'])
        
    db_schedule = ContainerSchedule(**data)
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    
    # Add to scheduler
    scheduler_service.add_job_from_model(db_schedule)
    
    return db_schedule

@router.put("/{schedule_id}", response_model=Schedule)
def update_schedule(
    schedule_id: int,
    schedule_in: ScheduleCreate,
    db: Session = Depends(deps.get_db),
    current_user: str = Depends(deps.get_current_user)
):
    """
    Update a schedule (e.g., toggle active state).
    """
    schedule = db.query(ContainerSchedule).filter(ContainerSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    # Update schedule fields
    data = schedule_in.dict()
    if 'container_ids' in data and isinstance(data['container_ids'], list):
        data['container_ids'] = json.dumps(data['container_ids'])

    for field, value in data.items():
        setattr(schedule, field, value)
    
    db.commit()
    db.refresh(schedule)
    
    # Update scheduler job
    if schedule.is_active:
        # Remove old job and add updated one
        scheduler_service.remove_job(schedule.id)
        scheduler_service.add_job_from_model(schedule)
    else:
        # Remove job if deactivated
        scheduler_service.remove_job(schedule.id)
    
    return schedule

@router.delete("/{schedule_id}")
def delete_schedule(schedule_id: int, db: Session = Depends(deps.get_db), current_user: str = Depends(deps.get_current_user)):
    schedule = db.query(ContainerSchedule).filter(ContainerSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    # Remove from scheduler
    scheduler_service.remove_job(schedule.id)
    
    db.delete(schedule)
    db.commit()
    return {"ok": True}
