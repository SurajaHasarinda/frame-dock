from fastapi import APIRouter, HTTPException, Query, Body, Depends
from typing import List, Optional, Dict
from app.services.docker_service import docker_service
from app.api.deps import get_current_user
from app.schemas.docker import (
    ContainerSummary, 
    ContainerCreate,
    ContainerResourceUpdate, 
    ContainerAction,
    ImageSummary,
    PruneResult
)

router = APIRouter()

# --- Containers ---

@router.post("/containers", response_model=ContainerAction, status_code=201)
def create_container(container: ContainerCreate, current_user: str = Depends(get_current_user)):
    """
    Create a new container from an image.
    """
    try:
        new_container = docker_service.create_container(
            image=container.image,
            name=container.name,
            ports=container.ports,
            environment=container.environment,
            volumes=container.volumes,
            command=container.command,
            detach=True,
            restart_policy=container.restart_policy,
            cpu_quota=container.cpu_quota,
            mem_limit=container.mem_limit
        )
        if new_container:
            return {
                "success": True, 
                "message": "Container created successfully",
                "container_id": new_container.short_id
            }
        raise HTTPException(status_code=400, detail="Failed to create container")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/containers", response_model=List[ContainerSummary])
def list_containers(all: bool = True, current_user: str = Depends(get_current_user)):
    """
    List all containers (running and stopped by default).
    """
    try:
        return docker_service.list_containers(all=all)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/containers/{container_id}", response_model=Dict)
def get_container(container_id: str, current_user: str = Depends(get_current_user)):
    """
    Get detailed information about a specific container.
    """
    container = docker_service.get_container(container_id)
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")
    return container.attrs

@router.post("/containers/{container_id}/start", response_model=ContainerAction)
def start_container(container_id: str, current_user: str = Depends(get_current_user)):
    if docker_service.start_container(container_id):
        return {"success": True, "message": "Container started"}
    raise HTTPException(status_code=400, detail="Failed to start container or container not found")

@router.post("/containers/{container_id}/stop", response_model=ContainerAction)
def stop_container(container_id: str, current_user: str = Depends(get_current_user)):
    if docker_service.stop_container(container_id):
        return {"success": True, "message": "Container stopped"}
    raise HTTPException(status_code=400, detail="Failed to stop container or container not found")

@router.post("/containers/{container_id}/restart", response_model=ContainerAction)
def restart_container(container_id: str, current_user: str = Depends(get_current_user)):
    if docker_service.restart_container(container_id):
        return {"success": True, "message": "Container restarted"}
    raise HTTPException(status_code=400, detail="Failed to restart container or container not found")

@router.delete("/containers/{container_id}", response_model=ContainerAction)
def delete_container(container_id: str, force: bool = False, current_user: str = Depends(get_current_user)):
    if docker_service.delete_container(container_id, force=force):
        return {"success": True, "message": "Container deleted"}
    
    # Check if container exists and is running
    container = docker_service.get_container(container_id)
    if container and container.status == "running":
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete a running container. Stop it first or use force=true"
        )
    raise HTTPException(status_code=400, detail="Failed to delete container or container not found")

@router.patch("/containers/{container_id}/resources", response_model=ContainerAction)
def update_resources(container_id: str, resources: ContainerResourceUpdate, current_user: str = Depends(get_current_user)):
    """
    Update container resources (CPU/Memory).
    """
    success = docker_service.update_container_resources(
        container_id, 
        cpu_quota=resources.cpu_quota, 
        mem_limit=resources.mem_limit
    )
    if success:
        return {"success": True, "message": "Resources updated"}
    raise HTTPException(status_code=400, detail="Failed to update resources or container not found")

@router.get("/containers/{container_id}/stats")
def get_stats(container_id: str, stream: bool = False, current_user: str = Depends(get_current_user)):
    """
    Get container stats. 
    Note: if stream=True, this might block standard HTTP. 
    For now, returns a snapshot if stream=False.
    """
    stats = docker_service.get_container_stats(container_id, stream=stream)
    if stats:
        return stats
    raise HTTPException(status_code=404, detail="Container not found")

# --- Images ---

@router.get("/images", response_model=List[ImageSummary])
def list_images(current_user: str = Depends(get_current_user)):
    try:
        return docker_service.list_images()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/images/{image_id}", response_model=ContainerAction)
def delete_image(image_id: str, force: bool = False, current_user: str = Depends(get_current_user)):
    if docker_service.delete_image(image_id, force=force):
        return {"success": True, "message": "Image deleted"}
    raise HTTPException(status_code=400, detail="Failed to delete image (it might be in use)")

@router.post("/images/prune", response_model=PruneResult)
def prune_images(current_user: str = Depends(get_current_user)):
    """
    Remove unused images.
    """
    try:
        return docker_service.prune_images()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
