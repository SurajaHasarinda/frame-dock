from enum import Enum
from sqlalchemy import Column, Integer, String, Boolean, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base_class import Base

class ScheduleType(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    CUSTOM = "custom" # One-time

class ActionType(str, Enum):
    START = "start"
    STOP = "stop"
    RESTART = "restart"
    SLEEP = "sleep"  # Stop at time_expression, start at wake_time_expression

class ContainerSchedule(Base):
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    container_ids: Mapped[str] = mapped_column(String, index=True) # JSON list of IDs
    schedule_name: Mapped[str] = mapped_column(String)
    
    schedule_type: Mapped[ScheduleType] = mapped_column(SAEnum(ScheduleType))
    action: Mapped[ActionType] = mapped_column(SAEnum(ActionType))
    
    # Scheduling details
    # For daily: "14:30"
    # For weekly: "mon 14:30"
    # For monthly: "1 14:30" (Day of month)
    # For custom: "2023-10-27 14:30:00"
    time_expression: Mapped[str] = mapped_column(String)
    
    # For SLEEP action: time to wake up (start container)
    # Uses same format as time_expression based on schedule_type
    wake_time_expression: Mapped[str] = mapped_column(String, nullable=True)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
