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
                    "id": container.short_id,
                    "name": container.name,
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

    def get_all_container_stats(self) -> List[Dict[str, Any]]:
        self._check_client()
        containers = self.client.containers.list() # List only running containers by default
        results = []
        for c in containers:
            # Exclude self container if needed
            if self.current_container_id and (c.id == self.current_container_id or c.id.startswith(self.current_container_id)):
                continue

            # We can optimise this by not calling get_container inside get_container_stats, 
            # but for now reusing the logic is safer and cleaner code-wise.
            stats = self.get_container_stats(c.id)
            if stats:
                results.append(stats)
        
        # Sort by memory usage descending by default
        results.sort(key=lambda x: x['memory_usage'], reverse=True)
        return results

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

    def pull_image(self, image_name: str) -> bool:
        """Pull the latest version of an image from the registry."""
        self._check_client()
        try:
            logger.info(f"Pulling latest image: {image_name}")
            self.client.images.pull(image_name)
            return True
        except APIError as e:
            logger.error(f"Failed to pull image {image_name}: {e}")
            return False

    def update_container(self, container_id: str) -> Dict[str, Any]:
        """
        Update a container by pulling the latest image and recreating it
        with the same configuration.
        
        Steps:
        1. Get the current container's configuration
        2. Pull the latest version of the image
        3. Stop and remove the old container
        4. Create a new container with the same configuration
        5. Start the new container
        """
        self._check_client()
        container = self.get_container(container_id)
        if not container:
            return {"success": False, "message": "Container not found"}

        try:
            # Extract configuration from the existing container
            attrs = container.attrs
            config = attrs.get("Config", {})
            host_config = attrs.get("HostConfig", {})
            network_settings = attrs.get("NetworkSettings", {})

            # Get the image name (use tag if available, fall back to image ID)
            image_name = config.get("Image", "")
            if not image_name:
                if container.image and container.image.tags:
                    image_name = container.image.tags[0]
                else:
                    return {"success": False, "message": "Cannot determine image name for container"}

            container_name = container.name
            was_running = container.status == "running"

            # Step 1: Pull the latest image
            logger.info(f"Pulling latest image for container '{container_name}': {image_name}")
            pull_success = self.pull_image(image_name)
            if not pull_success:
                return {"success": False, "message": f"Failed to pull latest image: {image_name}"}

            # Step 2: Extract all configuration we need to preserve
            # Ports
            port_bindings = host_config.get("PortBindings") or {}
            exposed_ports = config.get("ExposedPorts") or {}

            # Environment variables
            env_list = config.get("Env") or []

            # Volumes / Binds
            binds = host_config.get("Binds") or []
            volumes = config.get("Volumes") or {}

            # Command
            cmd = config.get("Cmd")

            # Entrypoint
            entrypoint = config.get("Entrypoint")

            # Working directory
            working_dir = config.get("WorkingDir") or None

            # User
            user = config.get("User") or None

            # Restart policy
            restart_policy = host_config.get("RestartPolicy") or {}

            # Resource limits
            cpu_quota = host_config.get("CpuQuota") or None
            cpu_period = host_config.get("CpuPeriod") or None
            cpu_shares = host_config.get("CpuShares") or None
            mem_limit = host_config.get("Memory") or None
            memswap_limit = host_config.get("MemorySwap") or None

            # Network mode
            network_mode = host_config.get("NetworkMode") or None

            # Collect custom networks to reconnect after creation
            networks = network_settings.get("Networks") or {}

            # Labels
            labels = config.get("Labels") or {}

            # Hostname / Domainname
            hostname = config.get("Hostname") or None
            domainname = config.get("Domainname") or None

            # Privileged
            privileged = host_config.get("Privileged", False)

            # DNS
            dns = host_config.get("Dns") or None
            dns_search = host_config.get("DnsSearch") or None

            # Extra hosts
            extra_hosts = host_config.get("ExtraHosts") or None

            # Tty and stdin
            tty = config.get("Tty", False)
            stdin_open = config.get("OpenStdin", False)

            # Capabilities
            cap_add = host_config.get("CapAdd") or None
            cap_drop = host_config.get("CapDrop") or None

            # Devices
            devices = host_config.get("Devices") or None

            # Security options
            security_opt = host_config.get("SecurityOpt") or None

            # Tmpfs
            tmpfs = host_config.get("Tmpfs") or None

            # Sysctls
            sysctls = host_config.get("Sysctls") or None

            # PID mode
            pid_mode = host_config.get("PidMode") or None

            # Step 3: Stop and remove the old container
            logger.info(f"Stopping container '{container_name}'...")
            if was_running:
                try:
                    container.stop(timeout=30)
                except Exception as e:
                    logger.warning(f"Error stopping container: {e}")

            logger.info(f"Removing container '{container_name}'...")
            try:
                container.remove(force=True)
            except Exception as e:
                logger.error(f"Failed to remove container '{container_name}': {e}")
                return {"success": False, "message": f"Failed to remove old container: {str(e)}"}

            # Step 4: Build kwargs for the new container
            kwargs: Dict[str, Any] = {
                "image": image_name,
                "name": container_name,
                "detach": True,
                "tty": tty,
                "stdin_open": stdin_open,
            }

            # Determine if this is a host network or custom network
            is_host_network = network_mode == "host"
            
            # Determine custom networks (not default/bridge/host)
            custom_networks = {
                name: net_config for name, net_config in networks.items()
                if name not in ("bridge", "host", "none")
            }

            # Port bindings are incompatible with host network mode
            if port_bindings and not is_host_network:
                kwargs["ports"] = port_bindings
            if env_list:
                kwargs["environment"] = env_list
            if binds:
                kwargs["volumes"] = binds
            if cmd:
                kwargs["command"] = cmd
            if entrypoint:
                kwargs["entrypoint"] = entrypoint
            if working_dir:
                kwargs["working_dir"] = working_dir
            if user:
                kwargs["user"] = user
            if restart_policy and restart_policy.get("Name"):
                kwargs["restart_policy"] = restart_policy
            if labels:
                kwargs["labels"] = labels
            if hostname and not is_host_network:
                kwargs["hostname"] = hostname
            if domainname:
                kwargs["domainname"] = domainname
            if privileged:
                kwargs["privileged"] = privileged
            if dns:
                kwargs["dns"] = dns
            if dns_search:
                kwargs["dns_search"] = dns_search
            if extra_hosts:
                kwargs["extra_hosts"] = extra_hosts
            if cap_add:
                kwargs["cap_add"] = cap_add
            if cap_drop:
                kwargs["cap_drop"] = cap_drop
            if devices:
                kwargs["devices"] = [
                    f"{d['PathOnHost']}:{d['PathInContainer']}:{d['CgroupPermissions']}"
                    for d in devices
                ]
            if security_opt:
                kwargs["security_opt"] = security_opt
            if tmpfs:
                kwargs["tmpfs"] = tmpfs
            if sysctls:
                kwargs["sysctls"] = sysctls
            if pid_mode:
                kwargs["pid_mode"] = pid_mode

            # Network mode handling:
            # If a custom network exists, use it as the primary network_mode
            # Otherwise fall back to the original network_mode
            if custom_networks:
                # Use the first custom network as the primary network
                primary_network = list(custom_networks.keys())[0]
                kwargs["network"] = primary_network
            elif network_mode and network_mode not in ("default", "bridge"):
                kwargs["network_mode"] = network_mode

            # Resource limits
            if cpu_quota and cpu_quota > 0:
                kwargs["cpu_quota"] = cpu_quota
            if cpu_period and cpu_period > 0:
                kwargs["cpu_period"] = cpu_period
            if cpu_shares and cpu_shares > 0:
                kwargs["cpu_shares"] = cpu_shares
            if mem_limit and mem_limit > 0:
                kwargs["mem_limit"] = mem_limit
            if memswap_limit and memswap_limit > 0:
                kwargs["memswap_limit"] = memswap_limit

            # Step 5: Create the new container
            logger.info(f"Creating new container '{container_name}' with latest image...")
            logger.info(f"Container kwargs: image={image_name}, network_mode={network_mode}, "
                        f"custom_networks={list(custom_networks.keys()) if custom_networks else 'none'}, "
                        f"ports={'yes' if port_bindings else 'no'}, "
                        f"volumes={'yes' if binds else 'no'}")
            
            new_container = self.client.containers.run(**kwargs)

            # Connect to additional custom networks (if more than one)
            if len(custom_networks) > 1:
                for net_name in list(custom_networks.keys())[1:]:
                    try:
                        network = self.client.networks.get(net_name)
                        network.connect(new_container)
                        logger.info(f"Connected container to additional network: {net_name}")
                    except Exception as e:
                        logger.warning(f"Failed to connect to network '{net_name}': {e}")

            logger.info(f"Container '{container_name}' updated successfully. New ID: {new_container.short_id}")
            return {
                "success": True,
                "message": f"Container '{container_name}' updated to latest image",
                "container_id": new_container.short_id
            }

        except Exception as e:
            logger.error(f"Failed to update container '{container_id}': {e}", exc_info=True)
            return {"success": False, "message": f"Update failed: {str(e)}"}

# Global instance
docker_service = DockerService()
