from pydantic import BaseModel, model_validator
from typing import Optional, List
import json
from pydantic import BaseModel, model_validator, field_validator
from app.models.schedule import ScheduleType, ActionType

class ScheduleBase(BaseModel):
    container_ids: List[str]
    schedule_name: str
    schedule_type: ScheduleType
    action: ActionType
    time_expression: str 
    wake_time_expression: Optional[str] = None  # Required for SLEEP action
    is_active: bool = True

    @field_validator('container_ids', mode='before')
    @classmethod
    def parse_ids(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except ValueError:
                return [v]
        return v

# Validation helper function
def validate_time_format(time_expr: str, schedule_type: ScheduleType):
    """Helper to validate time expression format"""
    try:
        if schedule_type == ScheduleType.DAILY:
            # "14:30"
            h, m = time_expr.split(':')
            if not (0 <= int(h) <= 23 and 0 <= int(m) <= 59):
                raise ValueError
        elif schedule_type == ScheduleType.WEEKLY:
            # "mon 14:30"
            parts = time_expr.split(' ')
            if len(parts) != 2:
                raise ValueError
            day, time_str = parts
            h, m = time_str.split(':')
            if not (0 <= int(h) <= 23 and 0 <= int(m) <= 59):
                raise ValueError
        elif schedule_type == ScheduleType.MONTHLY:
            # "1 14:30"
            parts = time_expr.split(' ')
            if len(parts) != 2:
                raise ValueError
            day, time_str = parts
            h, m = time_str.split(':')
            if not (0 <= int(day) <= 31 and 0 <= int(h) <= 23 and 0 <= int(m) <= 59):
                raise ValueError
        elif schedule_type == ScheduleType.CUSTOM:
            # "2023-10-27 14:30:00"
            from datetime import datetime
            datetime.strptime(time_expr, "%Y-%m-%d %H:%M:%S")
    except Exception:
        raise ValueError(f"Invalid time_expression '{time_expr}' for schedule type '{schedule_type}'")

class ScheduleCreate(ScheduleBase):
    @model_validator(mode='after')
    def validate_schedule(self):
        # Validate that SLEEP action has wake_time_expression
        if self.action == ActionType.SLEEP:
            if not self.wake_time_expression:
                raise ValueError("wake_time_expression is required for SLEEP action")
        
        # Validate time_expression
        validate_time_format(self.time_expression, self.schedule_type)
        
        # Validate wake_time_expression if present
        if self.wake_time_expression:
            validate_time_format(self.wake_time_expression, self.schedule_type)
            # Ensure sleep and wake times are different
            if self.wake_time_expression == self.time_expression:
                raise ValueError("wake_time_expression must be different from time_expression")
        
        return self

class ScheduleUpdate(ScheduleBase):
    @model_validator(mode='after')
    def validate_schedule(self):
        # Validate that SLEEP action has wake_time_expression
        if self.action == ActionType.SLEEP:
            if not self.wake_time_expression:
                raise ValueError("wake_time_expression is required for SLEEP action")
        
        # Validate time_expression
        validate_time_format(self.time_expression, self.schedule_type)
        
        # Validate wake_time_expression if present
        if self.wake_time_expression:
            validate_time_format(self.wake_time_expression, self.schedule_type)
            # Ensure sleep and wake times are different
            if self.wake_time_expression == self.time_expression:
                raise ValueError("wake_time_expression must be different from time_expression")
        
        return self

class Schedule(ScheduleBase):
    id: int

    class Config:
        from_attributes = True
