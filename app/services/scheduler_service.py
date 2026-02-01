from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.date import DateTrigger
from sqlalchemy.orm import Session
from datetime import datetime
import json
import logging

from app.db.session import SessionLocal
from app.models.schedule import ContainerSchedule, ScheduleType, ActionType
from app.services.docker_service import docker_service

logger = logging.getLogger(__name__)

class SchedulerService:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        # We don't start it immediately in __init__ because it might need a running loop
        # It will be started when added to the app lifespan or manually

    def start(self):
        if not self.scheduler.running:
            self.scheduler.start()

    async def execute_action(self, container_ids: list, action: ActionType):
        if isinstance(container_ids, str):
            container_ids = [container_ids]
            
        logger.info(f"Executing scheduled action {action} on containers {container_ids}")
        
        for container_id in container_ids:
            try:
                if action == ActionType.STOP:
                    docker_service.stop_container(container_id)
                elif action == ActionType.START:
                    docker_service.start_container(container_id)
                elif action == ActionType.RESTART:
                    docker_service.restart_container(container_id)
            except Exception as e:
                logger.error(f"Failed to execute {action} on container {container_id}: {e}")

    def add_job_from_model(self, schedule: ContainerSchedule):
        job_id = str(schedule.id)
        
        # Remove existing jobs if present to avoid duplicates on update
        self.remove_job(schedule.id)

        if not schedule.is_active:
            return

        # Parse container IDs
        try:
            container_ids = json.loads(schedule.container_ids)
        except (ValueError, TypeError):
            # Fallback for old data or simple string
            container_ids = [schedule.container_ids] if schedule.container_ids else []

        trigger = None
        wake_trigger = None
        
        # Parse time expression
        # time_expression format example validation should happen in service/schema layer
        try:
            # For SLEEP action, we need to create two jobs
            if schedule.action == ActionType.SLEEP:
                if not schedule.wake_time_expression:
                    logger.error(f"SLEEP action requires wake_time_expression for schedule {schedule.id}")
                    return
                
                # Create sleep trigger (stop container)
                if schedule.schedule_type == ScheduleType.DAILY:
                    hour, minute = schedule.time_expression.split(':')
                    trigger = CronTrigger(hour=hour, minute=minute)
                    
                    wake_hour, wake_minute = schedule.wake_time_expression.split(':')
                    wake_trigger = CronTrigger(hour=wake_hour, minute=wake_minute)
                
                elif schedule.schedule_type == ScheduleType.WEEKLY:
                    day, time_str = schedule.time_expression.split(' ')
                    hour, minute = time_str.split(':')
                    trigger = CronTrigger(day_of_week=day, hour=hour, minute=minute)
                    
                    wake_day, wake_time_str = schedule.wake_time_expression.split(' ')
                    wake_hour, wake_minute = wake_time_str.split(':')
                    wake_trigger = CronTrigger(day_of_week=wake_day, hour=wake_hour, minute=wake_minute)

                elif schedule.schedule_type == ScheduleType.MONTHLY:
                    day, time_str = schedule.time_expression.split(' ')
                    hour, minute = time_str.split(':')
                    trigger = CronTrigger(day=day, hour=hour, minute=minute)
                    
                    wake_day, wake_time_str = schedule.wake_time_expression.split(' ')
                    wake_hour, wake_minute = wake_time_str.split(':')
                    wake_trigger = CronTrigger(day=wake_day, hour=wake_hour, minute=wake_minute)

                elif schedule.schedule_type == ScheduleType.CUSTOM:
                    run_date = datetime.strptime(schedule.time_expression, "%Y-%m-%d %H:%M:%S")
                    trigger = DateTrigger(run_date=run_date)
                    
                    wake_date = datetime.strptime(schedule.wake_time_expression, "%Y-%m-%d %H:%M:%S")
                    wake_trigger = DateTrigger(run_date=wake_date)
                
                # Add both jobs for SLEEP action
                if trigger and wake_trigger:
                    # Job to stop container
                    self.scheduler.add_job(
                        self.execute_action,
                        trigger,
                        id=f"{job_id}_sleep",
                        args=[container_ids, ActionType.STOP],
                        replace_existing=True
                    )
                    # Job to start container
                    self.scheduler.add_job(
                        self.execute_action,
                        wake_trigger,
                        id=f"{job_id}_wake",
                        args=[container_ids, ActionType.START],
                        replace_existing=True
                    )
                    logger.info(f"Added SLEEP jobs for schedule {job_id}: stop and wake for {schedule.schedule_name}")
            
            else:
                # Handle regular actions (START, STOP, RESTART)
                if schedule.schedule_type == ScheduleType.DAILY:
                    # Exp: "14:30"
                    hour, minute = schedule.time_expression.split(':')
                    trigger = CronTrigger(hour=hour, minute=minute)
                
                elif schedule.schedule_type == ScheduleType.WEEKLY:
                    # Exp: "mon 14:30"
                    day, time_str = schedule.time_expression.split(' ')
                    hour, minute = time_str.split(':')
                    trigger = CronTrigger(day_of_week=day, hour=hour, minute=minute)

                elif schedule.schedule_type == ScheduleType.MONTHLY:
                    # Exp: "1 14:30" (1st day of month)
                    day, time_str = schedule.time_expression.split(' ')
                    hour, minute = time_str.split(':')
                    trigger = CronTrigger(day=day, hour=hour, minute=minute)

                elif schedule.schedule_type == ScheduleType.CUSTOM:
                    # Exp: "2023-10-27 14:30:00"
                    run_date = datetime.strptime(schedule.time_expression, "%Y-%m-%d %H:%M:%S")
                    trigger = DateTrigger(run_date=run_date)

                if trigger:
                    self.scheduler.add_job(
                        self.execute_action,
                        trigger,
                        id=job_id,
                        args=[container_ids, schedule.action],
                        replace_existing=True
                    )
                    logger.info(f"Added job {job_id} for {schedule.schedule_name}")
                
        except Exception as e:
            logger.error(f"Failed to schedule job {schedule.id}: {e}")

    def load_jobs_from_db(self):
        """Reloads all active schedules from the database."""
        db: Session = SessionLocal()
        try:
            schedules = db.query(ContainerSchedule).filter(ContainerSchedule.is_active == True).all()
            for schedule in schedules:
                self.add_job_from_model(schedule)
        finally:
            db.close()

    def remove_job(self, schedule_id: int):
        job_id = str(schedule_id)
        # Remove regular job
        if self.scheduler.get_job(job_id):
            self.scheduler.remove_job(job_id)
        # Remove sleep/wake jobs if they exist
        if self.scheduler.get_job(f"{job_id}_sleep"):
            self.scheduler.remove_job(f"{job_id}_sleep")
        if self.scheduler.get_job(f"{job_id}_wake"):
            self.scheduler.remove_job(f"{job_id}_wake")

scheduler_service = SchedulerService()
