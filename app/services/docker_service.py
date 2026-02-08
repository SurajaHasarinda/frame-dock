import docker
from docker.errors import DockerException, APIError, NotFound
from typing import List, Dict, Optional, Any
import logging
import os

logger = logging.getLogger(__name__)

class DockerService:
    def __init__(self):
        try:
            self.client = docker.from_env()
            # Get current container hostname (used as container ID)
            self.current_container_id = os.environ.get('HOSTNAME', '')
            # Get current image if running in Docker
            self.current_image = None
            if self.current_container_id:
                try:
                    container = self.client.containers.get(self.current_container_id)
                    self.current_image = container.image.id
                except Exception:
                    pass
        except DockerException as e:
            logger.error(f"Failed to initialize Docker client: {e}")
            self.client = None
            self.current_container_id = ''
            self.current_image = None

    def _check_client(self):
        if not self.client:
            raise RuntimeError("Docker client not initialized. Is Docker running?")

    # --- Container Management ---

    def list_containers(self, all: bool = True) -> List[Dict[str, Any]]:
        self._check_client()
        containers = self.client.containers.list(all=all)
        return [
            {
                "id": c.short_id,
                "name": c.name,
                "status": c.status,
                "state": c.status,  # Add state field for consistency
                "image": c.image.tags[0] if c.image and c.image.tags else (c.image.id if c.image else "unknown"),
                "created": c.attrs["Created"],
                "ports": c.attrs["NetworkSettings"]["Ports"],
                "cpu_quota": c.attrs.get("HostConfig", {}).get("CpuQuota"),
                "memory_limit": c.attrs.get("HostConfig", {}).get("Memory")
            }
            for c in containers
            # Exclude self container
            if not self.current_container_id or (c.id != self.current_container_id and not c.id.startswith(self.current_container_id))
        ]

    def get_container(self, container_id: str):
        self._check_client()
        try:
            return self.client.containers.get(container_id)
        except NotFound:
            return None

    def restart_container(self, container_id: str) -> bool:
        self._check_client()
        container = self.get_container(container_id)
        if container:
            try:
                container.restart()
                return True
            except APIError as e:
                logger.error(f"Failed to restart container {container_id}: {e}")
                return False
        return False

    def stop_container(self, container_id: str) -> bool:
        self._check_client()
        container = self.get_container(container_id)
        if container:
            try:
                container.stop()
                return True
            except APIError as e:
                logger.error(f"Failed to stop container {container_id}: {e}")
                return False
        return False

    def start_container(self, container_id: str) -> bool:
        self._check_client()
        container = self.get_container(container_id)
        if container:
            try:
                container.start()
                return True
            except APIError as e:
                logger.error(f"Failed to start container {container_id}: {e}")
                return False
        return False

    def create_container(self, image: str, name: Optional[str] = None,
                        ports: Optional[Dict[str, int]] = None,
                        environment: Optional[Dict[str, str]] = None,
                        volumes: Optional[Dict[str, Dict[str, str]]] = None,
                        command: Optional[str] = None,
                        detach: bool = True,
                        restart_policy: Optional[Dict[str, Any]] = None,
                        cpu_quota: Optional[int] = None,
                        mem_limit: Optional[str] = None):
        """Create a new container from an image."""
        self._check_client()
        try:
            kwargs: Dict[str, Any] = {
                "image": image,
                "name": name,
                "ports": ports,
                "environment": environment,
                "volumes": volumes,
                "command": command,
                "detach": detach,
                "restart_policy": restart_policy
            }
            
            # Add resource limits if specified
            if cpu_quota is not None:
                kwargs["cpu_quota"] = cpu_quota
            if mem_limit is not None:
                kwargs["mem_limit"] = mem_limit
                # Set memswap_limit to match mem_limit (no swap) to avoid update conflicts later
                kwargs["memswap_limit"] = mem_limit
            
            return self.client.containers.run(**kwargs)
        except APIError as e:
            logger.error(f"Error creating container: {e}")
            return None

    def delete_container(self, container_id: str, force: bool = False) -> bool:
        self._check_client()
        container = self.get_container(container_id)
        if container:
            try:
                container.remove(force=force)
                return True
            except APIError as e:
                logger.error(f"Failed to delete container {container_id}: {e}")
                return False
        return False

    def update_container_resources(self, container_id: str, 
                                 cpu_quota: Optional[int] = None, 
                                 mem_limit: Optional[str] = None) -> bool:
        """Update resource limits for a running container."""
        self._check_client()
        container = self.get_container(container_id)
        if not container:
            return False
        
        kwargs: Dict[str, Any] = {}
        if cpu_quota is not None:
            kwargs["cpu_quota"] = cpu_quota
        if mem_limit is not None:
            kwargs["mem_limit"] = mem_limit
            # Set memswap_limit to match mem_limit to avoid conflicts
            # -1 means unlimited swap, or we can set it equal to mem_limit (no swap)
            kwargs["memswap_limit"] = mem_limit
        
        if kwargs:
            container.update(**kwargs)
            return True
        return False

    # --- Monitoring ---

    def get_container_stats(self, container_id: str, stream: bool = False):
        self._check_client()
        container = self.get_container(container_id)
        if container:
            try:
                stats = container.stats(stream=False)
                # Parse the stats to get useful metrics
                cpu_stats = stats.get("cpu_stats", {})
                precpu_stats = stats.get("precpu_stats", {})
                memory_stats = stats.get("memory_stats", {})
                networks = stats.get("networks", {})
                blkio_stats = stats.get("blkio_stats", {})
                
                # Calculate CPU percentage
                cpu_delta = cpu_stats.get("cpu_usage", {}).get("total_usage", 0) - precpu_stats.get("cpu_usage", {}).get("total_usage", 0)
                system_delta = cpu_stats.get("system_cpu_usage", 0) - precpu_stats.get("system_cpu_usage", 0)
                online_cpus = cpu_stats.get("online_cpus", 1)
                cpu_percent = 0.0
                if system_delta > 0 and cpu_delta > 0:
                    cpu_percent = (cpu_delta / system_delta) * online_cpus * 100.0
                
                # Memory usage
                memory_usage = memory_stats.get("usage", 0)
                memory_limit = memory_stats.get("limit", 0)
                memory_percent = (memory_usage / memory_limit * 100) if memory_limit > 0 else 0
                
                # Network I/O
                net_input = 0
                net_output = 0
                for interface, data in networks.items():
                    net_input += data.get("rx_bytes", 0)
                    net_output += data.get("tx_bytes", 0)
                
                # Block I/O
                block_read = 0
                block_write = 0
                for entry in blkio_stats.get("io_service_bytes_recursive", []):
                    if entry.get("op") == "read":
                        block_read += entry.get("value", 0)
                    elif entry.get("op") == "write":
                        block_write += entry.get("value", 0)
                
                return {
                    "cpu_percent": round(cpu_percent, 2),
                    "memory_usage": memory_usage,
                    "memory_limit": memory_limit,
                    "memory_percent": round(memory_percent, 2),
                    "network_input": net_input,
                    "network_output": net_output,
                    "block_read": block_read,
                    "block_write": block_write,
                    "pids": stats.get("pids_stats", {}).get("current", 0),
                }
            except Exception as e:
                logger.error(f"Error getting stats for container {container_id}: {e}")
                return None
        return None

    # --- Image Management ---

    def list_images(self) -> List[Dict[str, Any]]:
        self._check_client()
        images = self.client.images.list()
        return [
            {
                "id": img.id,  # Use full ID for deletion
                "tags": img.tags,
                "size": img.attrs["Size"],
                "created": img.attrs["Created"]
            }
            for img in images
            # Exclude self image
            if not (self.current_image and img.id == self.current_image)
        ]

    def delete_image(self, image_id: str, force: bool = False) -> bool:
        self._check_client()
        try:
            self.client.images.remove(image_id, force=force)
            return True
        except APIError as e:
            logger.error(f"Error removing image: {e}")
            return False

    def prune_images(self, filters: Optional[Dict] = None) -> Dict[str, Any]:
        self._check_client()
        return self.client.images.prune(filters=filters)

# Global instance
docker_service = DockerService()
