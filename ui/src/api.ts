import axios, { AxiosInstance } from 'axios';
import {
    Container,
    Schedule,
    DockerImage,
    AuthUser,
    CreateContainerRequest,
    CreateScheduleRequest,
} from './types';

const API_BASE_URL = '/api/v1';

class ApiService {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Add request interceptor to include auth token
        this.client.interceptors.request.use(
            (config) => {
                const token = this.getToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Add response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    this.logout();
                    window.location.href = '/#/login';
                }
                return Promise.reject(error);
            }
        );
    }

    private getToken(): string | null {
        return localStorage.getItem('framedock_token');
    }

    private setToken(token: string) {
        localStorage.setItem('framedock_token', token);
    }

    private removeToken() {
        localStorage.removeItem('framedock_token');
        localStorage.removeItem('framedock_user');
    }

    // Auth
    async login(username: string, password: string): Promise<AuthUser> {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/login`, {
                username,
                password,
            });

            const { access_token } = response.data;
            this.setToken(access_token);
            localStorage.setItem('framedock_user', username);

            return { username, token: access_token };
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('Invalid username or password');
            }
            throw new Error(error.response?.data?.detail || 'Login failed');
        }
    }

    logout() {
        this.removeToken();
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    getCurrentUser(): string {
        return localStorage.getItem('framedock_user') || 'Guest';
    }

    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        try {
            await this.client.post('/auth/change-password', {
                current_password: currentPassword,
                new_password: newPassword,
            });
        } catch (error: any) {
            if (error.response?.status === 400) {
                throw new Error('Current password is incorrect');
            }
            throw new Error(error.response?.data?.detail || 'Failed to change password');
        }
    }

    async changeUsername(newUsername: string, password: string): Promise<void> {
        try {
            await this.client.post('/auth/change-username', {
                new_username: newUsername,
                password: password,
            });
            // Update stored username
            localStorage.setItem('framedock_user', newUsername);
        } catch (error: any) {
            if (error.response?.status === 400) {
                throw new Error('Password is incorrect');
            }
            throw new Error(error.response?.data?.detail || 'Failed to change username');
        }
    }

    // Containers
    async getContainers(all: boolean = true): Promise<Container[]> {
        const response = await this.client.get(`/docker/containers`, {
            params: { all },
        });
        return response.data;
    }

    async getContainer(id: string): Promise<Container> {
        const response = await this.client.get(`/docker/containers/${id}`);
        return response.data;
    }

    async createContainer(data: CreateContainerRequest): Promise<{ success: boolean; message: string; container_id: string }> {
        const response = await this.client.post('/docker/containers', data);
        return response.data;
    }

    async startContainer(id: string): Promise<void> {
        await this.client.post(`/docker/containers/${id}/start`);
    }

    async stopContainer(id: string): Promise<void> {
        await this.client.post(`/docker/containers/${id}/stop`);
    }

    async restartContainer(id: string): Promise<void> {
        await this.client.post(`/docker/containers/${id}/restart`);
    }

    async deleteContainer(id: string, force: boolean = false): Promise<void> {
        await this.client.delete(`/docker/containers/${id}`, {
            params: { force },
        });
    }

    async getContainerStats(id: string): Promise<any> {
        const response = await this.client.get(`/docker/containers/${id}/stats`);
        return response.data;
    }

    async updateContainerResources(
        id: string,
        resources: { cpu_quota?: number; mem_limit?: string }
    ): Promise<void> {
        await this.client.patch(`/docker/containers/${id}/resources`, resources);
    }

    // Schedules
    async getSchedules(): Promise<Schedule[]> {
        const response = await this.client.get('/schedules/');
        return response.data;
    }

    async createSchedule(data: CreateScheduleRequest): Promise<Schedule> {
        const response = await this.client.post('/schedules/', data);
        return response.data;
    }

    async toggleSchedule(id: number): Promise<void> {
        // Get the schedule first
        const schedules = await this.getSchedules();
        const schedule = schedules.find((s) => s.id === id);
        if (!schedule) throw new Error('Schedule not found');

        // Update with toggled active state - only send CreateScheduleRequest fields
        const updateData: CreateScheduleRequest = {
            container_ids: schedule.container_ids,
            schedule_name: schedule.schedule_name,
            schedule_type: schedule.schedule_type,
            action: schedule.action,
            time_expression: schedule.time_expression,
            is_active: !schedule.is_active,
        };
        
        // Include wake_time_expression if it exists
        if (schedule.wake_time_expression) {
            updateData.wake_time_expression = schedule.wake_time_expression;
        }

        await this.client.put(`/schedules/${id}`, updateData);
    }

    async updateSchedule(id: number, data: CreateScheduleRequest): Promise<Schedule> {
        const response = await this.client.put(`/schedules/${id}`, data);
        return response.data;
    }

    async deleteSchedule(id: number): Promise<void> {
        await this.client.delete(`/schedules/${id}`);
    }

    // Images
    async getImages(): Promise<DockerImage[]> {
        const response = await this.client.get('/docker/images');
        return response.data;
    }

    async deleteImage(id: string): Promise<void> {
        await this.client.delete(`/docker/images/${id}`);
    }

    async pruneImages(): Promise<void> {
        await this.client.post('/docker/images/prune');
    }

    // Health
    async healthCheck(): Promise<{ msg: string }> {
        const response = await this.client.get('/health');
        return response.data;
    }
}

export const api = new ApiService();
