# Import all the models, so that Base has them before being
# imported by Alembic or for create_all()
from app.db.base_class import Base  # noqa
from app.models.schedule import ContainerSchedule  # noqa
from app.models.user import User  # noqa
