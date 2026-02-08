export enum ContainerStatus {
    RUNNING = 'running',
    STOPPED = 'stopped',
    PAUSED = 'paused',
    EXITED = 'exited',
    CREATED = 'created',
    RESTARTING = 'restarting',
}

export interface Container {
    id: string;
    name: string;
    status: ContainerStatus;
    state: string;  // Container state (running, exited)
    image: string;
    created: string;
    ports: string[];
    cpuUsage?: number;
    memoryUsage?: string;
    networkIO?: string;
    diskIO?: string;
    cpu_quota?: number;  // CPU quota in microseconds
    memory_limit?: string | number;  // Memory limit (string: "512m", "1g" or number: bytes)
}

export interface Schedule {
    id: number;
    container_ids: string[];
    schedule_name: string;
    schedule_type: 'daily' | 'weekly' | 'monthly' | 'custom';
    action: 'start' | 'stop' | 'restart' | 'sleep';
    time_expression: string;
    wake_time_expression?: string;  // Required for sleep action
    is_active: boolean;
}

export interface DockerImage {
    id: string;
    tags: string[];
    size: string;
    created: string;
}

export interface AuthUser {
    username: string;
    token: string;
}

export interface CreateContainerRequest {
    image: string;
    name?: string;
    ports?: Record<string, number>;
    environment?: Record<string, string>;
    volumes?: Record<string, { bind: string; mode: string }>;
    command?: string;
    restart_policy?: {
        Name: string;
        MaximumRetryCount?: number;
    };
    cpu_quota?: number;  // CPU quota in microseconds (100000 = 100% of one core)
    mem_limit?: string;  // Memory limit (e.g., "512m", "1g")
}

export interface CreateScheduleRequest {
    container_ids: string[];
    schedule_name: string;
    schedule_type: 'daily' | 'weekly' | 'monthly' | 'custom';
    action: 'start' | 'stop' | 'restart' | 'sleep';
    time_expression: string;
    wake_time_expression?: string;  // Required for sleep action
    is_active?: boolean;
}

// System Stats Types
export interface CpuInfo {
    percent: number;
    count: number;
    count_logical: number;
    freq_current: number | null;
    freq_max: number | null;
    per_cpu_percent: number[];
}

export interface MemoryInfo {
    total: number;
    available: number;
    used: number;
    percent: number;
    swap_total: number;
    swap_used: number;
    swap_free: number;
    swap_percent: number;
}

export interface DiskUsage {
    device: string;
    mountpoint: string;
    fstype: string;
    total: number;
    used: number;
    free: number;
    percent: number;
}

export interface NetworkInterface {
    name: string;
    bytes_sent: number;
    bytes_recv: number;
    packets_sent: number;
    packets_recv: number;
    errin: number;
    errout: number;
    dropin: number;
    dropout: number;
}

export interface SystemStats {
    cpu: CpuInfo;
    memory: MemoryInfo;
    disks: DiskUsage[];
    network: NetworkInterface[];
    uptime: number;
    boot_time: number;
}

