from pydantic import BaseModel
from typing import List, Optional, Dict, Any

# --- Containers ---

class ContainerCreate(BaseModel):
    image: str
    name: Optional[str] = None
    ports: Optional[Dict[str, int]] = None  # {"8080/tcp": 8080}
    environment: Optional[Dict[str, str]] = None
    volumes: Optional[Dict[str, Dict[str, str]]] = None  # {"/host/path": {"bind": "/container/path", "mode": "rw"}}
    command: Optional[str] = None
    detach: bool = True
    restart_policy: Optional[Dict[str, Any]] = None  # {"Name": "always"}
    cpu_quota: Optional[int] = None  # CPU quota in microseconds (100000 = 100% of one core)
    mem_limit: Optional[str] = None  # Memory limit (e.g., "512m", "1g")

class ContainerResourceUpdate(BaseModel):
    cpu_quota: Optional[int] = None
    mem_limit: Optional[str] = None

class ContainerSummary(BaseModel):
    id: str
    name: str
    status: str
    state: str
    image: str
    created: str
    ports: Optional[Dict[str, Any]] = None
    cpu_quota: Optional[int] = None
    memory_limit: Optional[int] = None

class ContainerAction(BaseModel):
    success: bool
    message: Optional[str] = None
    container_id: Optional[str] = None

# --- Images ---

class ImageSummary(BaseModel):
    id: str
    tags: List[str]
    size: int
    created: str

class PruneResult(BaseModel):
    ImagesDeleted: Optional[List[Dict[str, str]]] = None
    SpaceReclaimed: Optional[int] = None
