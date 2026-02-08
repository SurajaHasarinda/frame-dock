
from fastapi import APIRouter, Depends
from app.api.deps import get_current_user
from app.models.user import User
import psutil
from typing import Dict, Any, List
from pydantic import BaseModel

router = APIRouter()


class DiskUsage(BaseModel):
    device: str
    mountpoint: str
    fstype: str
    total: int
    used: int
    free: int
    percent: float


class NetworkInterface(BaseModel):
    name: str
    bytes_sent: int
    bytes_recv: int
    packets_sent: int
    packets_recv: int
    errin: int
    errout: int
    dropin: int
    dropout: int


class CpuInfo(BaseModel):
    percent: float
    count: int
    count_logical: int
    freq_current: float | None
    freq_max: float | None
    per_cpu_percent: List[float]


class MemoryInfo(BaseModel):
    total: int
    available: int
    used: int
    percent: float
    swap_total: int
    swap_used: int
    swap_free: int
    swap_percent: float


class SystemStats(BaseModel):
    cpu: CpuInfo
    memory: MemoryInfo
    disks: List[DiskUsage]
    network: List[NetworkInterface]
    uptime: float
    boot_time: float


@router.get("/stats", response_model=SystemStats)
async def get_system_stats(
    current_user: User = Depends(get_current_user),
) -> SystemStats:
    """
    Get comprehensive system resource usage statistics.
    Includes CPU, memory, disk, and network information.
    """
    import time
    
    # CPU Information
    cpu_percent = psutil.cpu_percent(interval=0.1)
    cpu_freq = psutil.cpu_freq()
    cpu_info = CpuInfo(
        percent=cpu_percent,
        count=psutil.cpu_count(logical=False) or 1,
        count_logical=psutil.cpu_count(logical=True) or 1,
        freq_current=cpu_freq.current if cpu_freq else None,
        freq_max=cpu_freq.max if cpu_freq else None,
        per_cpu_percent=psutil.cpu_percent(interval=0.1, percpu=True),
    )
    
    # Memory Information
    mem = psutil.virtual_memory()
    swap = psutil.swap_memory()
    memory_info = MemoryInfo(
        total=mem.total,
        available=mem.available,
        used=mem.used,
        percent=mem.percent,
        swap_total=swap.total,
        swap_used=swap.used,
        swap_free=swap.free,
        swap_percent=swap.percent,
    )
    
    # Disk Information
    disks = []
    for partition in psutil.disk_partitions(all=False):
        try:
            usage = psutil.disk_usage(partition.mountpoint)
            disks.append(DiskUsage(
                device=partition.device,
                mountpoint=partition.mountpoint,
                fstype=partition.fstype,
                total=usage.total,
                used=usage.used,
                free=usage.free,
                percent=usage.percent,
            ))
        except (PermissionError, OSError):
            # Skip partitions that can't be accessed
            continue
    
    # Network Information
    net_io = psutil.net_io_counters(pernic=True)
    network = []
    for interface, stats in net_io.items():
        network.append(NetworkInterface(
            name=interface,
            bytes_sent=stats.bytes_sent,
            bytes_recv=stats.bytes_recv,
            packets_sent=stats.packets_sent,
            packets_recv=stats.packets_recv,
            errin=stats.errin,
            errout=stats.errout,
            dropin=stats.dropin,
            dropout=stats.dropout,
        ))
    
    # System uptime
    boot_time = psutil.boot_time()
    uptime = time.time() - boot_time
    
    return SystemStats(
        cpu=cpu_info,
        memory=memory_info,
        disks=disks,
        network=network,
        uptime=uptime,
        boot_time=boot_time,
    )


@router.get("/stats/cpu")
async def get_cpu_stats(
    current_user: User = Depends(get_current_user),
) -> CpuInfo:
    """Get CPU usage statistics."""
    cpu_percent = psutil.cpu_percent(interval=0.1)
    cpu_freq = psutil.cpu_freq()
    return CpuInfo(
        percent=cpu_percent,
        count=psutil.cpu_count(logical=False) or 1,
        count_logical=psutil.cpu_count(logical=True) or 1,
        freq_current=cpu_freq.current if cpu_freq else None,
        freq_max=cpu_freq.max if cpu_freq else None,
        per_cpu_percent=psutil.cpu_percent(interval=0.1, percpu=True),
    )


@router.get("/stats/memory")
async def get_memory_stats(
    current_user: User = Depends(get_current_user),
) -> MemoryInfo:
    """Get memory usage statistics."""
    mem = psutil.virtual_memory()
    swap = psutil.swap_memory()
    return MemoryInfo(
        total=mem.total,
        available=mem.available,
        used=mem.used,
        percent=mem.percent,
        swap_total=swap.total,
        swap_used=swap.used,
        swap_free=swap.free,
        swap_percent=swap.percent,
    )


@router.get("/stats/disks")
async def get_disk_stats(
    current_user: User = Depends(get_current_user),
) -> List[DiskUsage]:
    """Get disk usage statistics for all mounted partitions."""
    disks = []
    for partition in psutil.disk_partitions(all=False):
        try:
            usage = psutil.disk_usage(partition.mountpoint)
            disks.append(DiskUsage(
                device=partition.device,
                mountpoint=partition.mountpoint,
                fstype=partition.fstype,
                total=usage.total,
                used=usage.used,
                free=usage.free,
                percent=usage.percent,
            ))
        except (PermissionError, OSError):
            continue
    return disks


@router.get("/stats/network")
async def get_network_stats(
    current_user: User = Depends(get_current_user),
) -> List[NetworkInterface]:
    """Get network I/O statistics for all interfaces."""
    net_io = psutil.net_io_counters(pernic=True)
    network = []
    for interface, stats in net_io.items():
        network.append(NetworkInterface(
            name=interface,
            bytes_sent=stats.bytes_sent,
            bytes_recv=stats.bytes_recv,
            packets_sent=stats.packets_sent,
            packets_recv=stats.packets_recv,
            errin=stats.errin,
            errout=stats.errout,
            dropin=stats.dropin,
            dropout=stats.dropout,
        ))
    return network
