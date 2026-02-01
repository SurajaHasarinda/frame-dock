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
