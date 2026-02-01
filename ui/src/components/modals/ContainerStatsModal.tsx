import React, { useEffect, useState } from 'react';
import { X, Activity, Cpu, HardDrive, Network, Layers, RefreshCw } from 'lucide-react';
import { api } from '@/api';

interface ContainerStatsModalProps {
    isOpen: boolean;
    containerId: string;
    containerName: string;
    onClose: () => void;
}

interface ContainerStats {
    cpu_percent: number;
    memory_usage: number;
    memory_limit: number;
    memory_percent: number;
    network_input: number;
    network_output: number;
    block_read: number;
    block_write: number;
    pids: number;
}

const ContainerStatsModal: React.FC<ContainerStatsModalProps> = ({
    isOpen,
    containerId,
    containerName,
    onClose,
}) => {
    const [stats, setStats] = useState<ContainerStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [autoRefresh, setAutoRefresh] = useState(true);

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const fetchStats = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await api.getContainerStats(containerId);
            setStats(data);
        } catch (err: any) {
            console.error('Failed to fetch stats:', err);
            setError(err.response?.data?.detail || 'Failed to fetch container stats');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchStats();
            
            if (autoRefresh) {
                const interval = setInterval(fetchStats, 3000); // Refresh every 3 seconds
                return () => clearInterval(interval);
            }
        }
    }, [isOpen, autoRefresh, containerId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-docker/10 rounded-lg">
                            <Activity size={24} className="text-docker" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Container Stats</h2>
                            <p className="text-sm text-slate-400">{containerName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Controls */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={fetchStats}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-docker focus:ring-docker/50"
                            />
                            <span className="text-sm text-slate-400">Auto-refresh (3s)</span>
                        </label>
                    </div>

                    {error && (
                        <div className="p-4 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">
                            {error}
                        </div>
                    )}

                    {stats && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* CPU Usage */}
                            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-docker/10 rounded-lg">
                                        <Cpu size={20} className="text-docker" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">CPU Usage</h3>
                                        <p className="text-xs text-slate-500">Processor utilization</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-end gap-2">
                                        <span className="text-3xl font-bold text-white">
                                            {stats.cpu_percent.toFixed(2)}
                                        </span>
                                        <span className="text-lg text-slate-500 mb-1">%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-docker to-blue-400 transition-all duration-500"
                                            style={{ width: `${Math.min(stats.cpu_percent, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Memory Usage */}
                            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-success/10 rounded-lg">
                                        <HardDrive size={20} className="text-success" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">Memory Usage</h3>
                                        <p className="text-xs text-slate-500">RAM utilization</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-end gap-2">
                                        <span className="text-3xl font-bold text-white">
                                            {stats.memory_percent.toFixed(1)}
                                        </span>
                                        <span className="text-lg text-slate-500 mb-1">%</span>
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {formatBytes(stats.memory_usage)} / {formatBytes(stats.memory_limit)}
                                    </div>
                                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-success to-green-400 transition-all duration-500"
                                            style={{ width: `${Math.min(stats.memory_percent, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Network I/O */}
                            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-purple-500/10 rounded-lg">
                                        <Network size={20} className="text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">Network I/O</h3>
                                        <p className="text-xs text-slate-500">Data transferred</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500">Input (RX)</span>
                                        <span className="text-sm font-mono text-white">
                                            {formatBytes(stats.network_input)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500">Output (TX)</span>
                                        <span className="text-sm font-mono text-white">
                                            {formatBytes(stats.network_output)}
                                        </span>
                                    </div>
                                    <div className="pt-2 border-t border-slate-800">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500 font-semibold">Total</span>
                                            <span className="text-sm font-mono text-purple-400">
                                                {formatBytes(stats.network_input + stats.network_output)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Block I/O */}
                            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-warning/10 rounded-lg">
                                        <Layers size={20} className="text-warning" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">Block I/O</h3>
                                        <p className="text-xs text-slate-500">Disk operations</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500">Read</span>
                                        <span className="text-sm font-mono text-white">
                                            {formatBytes(stats.block_read)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500">Write</span>
                                        <span className="text-sm font-mono text-white">
                                            {formatBytes(stats.block_write)}
                                        </span>
                                    </div>
                                    <div className="pt-2 border-t border-slate-800">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500 font-semibold">Total</span>
                                            <span className="text-sm font-mono text-warning">
                                                {formatBytes(stats.block_read + stats.block_write)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Process Count */}
                            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 md:col-span-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-800 rounded-lg">
                                            <Activity size={20} className="text-slate-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-white">Running Processes</h3>
                                            <p className="text-xs text-slate-500">Active PIDs</p>
                                        </div>
                                    </div>
                                    <span className="text-2xl font-bold text-white">{stats.pids}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {loading && !stats && (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-4">
                            <RefreshCw size={48} className="animate-spin opacity-20" />
                            <p className="animate-pulse">Loading container stats...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContainerStatsModal;
