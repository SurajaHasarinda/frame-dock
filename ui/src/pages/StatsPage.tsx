import React, { useState, useEffect, useCallback } from 'react';
import {
    Activity,
    Cpu,
    HardDrive,
    MemoryStick,
    Network,
    RefreshCw,
    Clock,
    Server,
    Zap,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';
import { api } from '../api';
import { SystemStats, DiskUsage, NetworkInterface } from '../types';

const StatsPage: React.FC = () => {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const fetchStats = useCallback(async () => {
        try {
            const data = await api.getSystemStats();
            setStats(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch system stats');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(fetchStats, 3000);
        return () => clearInterval(interval);
    }, [autoRefresh, fetchStats]);

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatUptime = (seconds: number): string => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        }
        return `${secs}s`;
    };

    const getColorByPercent = (percent: number): string => {
        if (percent >= 90) return 'text-red-400';
        if (percent >= 70) return 'text-amber-400';
        return 'text-emerald-400';
    };

    const getBarColorByPercent = (percent: number): string => {
        if (percent >= 90) return 'bg-gradient-to-r from-red-500 to-red-400';
        if (percent >= 70) return 'bg-gradient-to-r from-amber-500 to-amber-400';
        return 'bg-gradient-to-r from-emerald-500 to-emerald-400';
    };

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="w-8 h-8 animate-spin text-docker" />
                    <span className="text-slate-400">Loading system stats...</span>
                </div>
            </div>
        );
    }

    if (error && !stats) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                        onClick={fetchStats}
                        className="px-4 py-2 bg-docker hover:bg-docker-dark rounded-lg transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Activity className="w-7 h-7 text-docker" />
                        System Stats
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Real-time host machine resource monitoring
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-docker focus:ring-docker focus:ring-offset-0"
                        />
                        Auto-refresh (3s)
                    </label>
                    <button
                        onClick={fetchStats}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {stats && (
                <>
                    {/* System Uptime Card */}
                    <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-slate-800 p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                                <Clock className="w-6 h-6 text-violet-400" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm">System Uptime</p>
                                <p className="text-2xl font-bold text-white">
                                    {formatUptime(stats.uptime)}
                                </p>
                            </div>
                            <div className="ml-auto text-right">
                                <p className="text-slate-400 text-sm">Boot Time</p>
                                <p className="text-slate-300">
                                    {new Date(stats.boot_time * 1000).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* CPU & Memory Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* CPU Card */}
                        <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-slate-800 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                    <Cpu className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">CPU Usage</h3>
                                    <p className="text-sm text-slate-400">
                                        {stats.cpu.count} cores • {stats.cpu.count_logical} threads
                                    </p>
                                </div>
                                <div className="ml-auto">
                                    <span className={`text-3xl font-bold ${getColorByPercent(stats.cpu.percent)}`}>
                                        {stats.cpu.percent.toFixed(1)}%
                                    </span>
                                </div>
                            </div>

                            {/* Overall CPU Bar */}
                            <div className="mb-4">
                                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${getBarColorByPercent(stats.cpu.percent)} transition-all duration-300`}
                                        style={{ width: `${stats.cpu.percent}%` }}
                                    />
                                </div>
                            </div>

                            {/* Per-CPU Bars */}
                            <div className="space-y-2">
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Per Core</p>
                                <div className="grid grid-cols-4 gap-2">
                                    {stats.cpu.per_cpu_percent.map((percent, index) => (
                                        <div key={index} className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-500">#{index + 1}</span>
                                                <span className={getColorByPercent(percent)}>
                                                    {percent.toFixed(0)}%
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${getBarColorByPercent(percent)} transition-all duration-300`}
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {stats.cpu.freq_current && (
                                <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-amber-400" />
                                    <span className="text-sm text-slate-400">
                                        Clock: {stats.cpu.freq_current.toFixed(0)} MHz
                                        {stats.cpu.freq_max && ` / ${stats.cpu.freq_max.toFixed(0)} MHz`}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Memory Card */}
                        <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-slate-800 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                    <MemoryStick className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Memory Usage</h3>
                                    <p className="text-sm text-slate-400">
                                        {formatBytes(stats.memory.used)} / {formatBytes(stats.memory.total)}
                                    </p>
                                </div>
                                <div className="ml-auto">
                                    <span className={`text-3xl font-bold ${getColorByPercent(stats.memory.percent)}`}>
                                        {stats.memory.percent.toFixed(1)}%
                                    </span>
                                </div>
                            </div>

                            {/* RAM Bar */}
                            <div className="mb-6">
                                <div className="flex justify-between text-xs text-slate-500 mb-1">
                                    <span>RAM</span>
                                    <span>{formatBytes(stats.memory.available)} available</span>
                                </div>
                                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${getBarColorByPercent(stats.memory.percent)} transition-all duration-300`}
                                        style={{ width: `${stats.memory.percent}%` }}
                                    />
                                </div>
                            </div>

                            {/* Swap */}
                            {stats.memory.swap_total > 0 && (
                                <div>
                                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                                        <span>Swap</span>
                                        <span>
                                            {formatBytes(stats.memory.swap_used)} / {formatBytes(stats.memory.swap_total)}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${getBarColorByPercent(stats.memory.swap_percent)} transition-all duration-300`}
                                            style={{ width: `${stats.memory.swap_percent}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Disk Usage */}
                    <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-slate-800 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                <HardDrive className="w-5 h-5 text-emerald-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white">Disk Usage</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {stats.disks.map((disk: DiskUsage, index: number) => (
                                <div
                                    key={index}
                                    className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium truncate" title={disk.mountpoint}>
                                                {disk.mountpoint}
                                            </p>
                                            <p className="text-xs text-slate-500 truncate" title={disk.device}>
                                                {disk.device} • {disk.fstype}
                                            </p>
                                        </div>
                                        <span className={`text-lg font-bold ${getColorByPercent(disk.percent)}`}>
                                            {disk.percent.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
                                        <div
                                            className={`h-full ${getBarColorByPercent(disk.percent)} transition-all duration-300`}
                                            style={{ width: `${disk.percent}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-400">
                                        <span>{formatBytes(disk.used)} used</span>
                                        <span>{formatBytes(disk.free)} free</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Network Interfaces */}
                    <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-slate-800 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                                <Network className="w-5 h-5 text-cyan-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white">Network Interfaces</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs text-slate-500 uppercase tracking-wider">
                                        <th className="pb-3 pr-4">Interface</th>
                                        <th className="pb-3 pr-4">
                                            <div className="flex items-center gap-1">
                                                <ArrowUp className="w-3 h-3 text-emerald-400" />
                                                Sent
                                            </div>
                                        </th>
                                        <th className="pb-3 pr-4">
                                            <div className="flex items-center gap-1">
                                                <ArrowDown className="w-3 h-3 text-blue-400" />
                                                Received
                                            </div>
                                        </th>
                                        <th className="pb-3 pr-4">Packets Sent</th>
                                        <th className="pb-3 pr-4">Packets Recv</th>
                                        <th className="pb-3">Errors</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {stats.network.map((iface: NetworkInterface, index: number) => (
                                        <tr key={index} className="text-sm">
                                            <td className="py-3 pr-4">
                                                <div className="flex items-center gap-2">
                                                    <Server className="w-4 h-4 text-slate-500" />
                                                    <span className="font-medium text-white">{iface.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 pr-4 text-emerald-400">
                                                {formatBytes(iface.bytes_sent)}
                                            </td>
                                            <td className="py-3 pr-4 text-blue-400">
                                                {formatBytes(iface.bytes_recv)}
                                            </td>
                                            <td className="py-3 pr-4 text-slate-300">
                                                {iface.packets_sent.toLocaleString()}
                                            </td>
                                            <td className="py-3 pr-4 text-slate-300">
                                                {iface.packets_recv.toLocaleString()}
                                            </td>
                                            <td className="py-3">
                                                <span className={iface.errin + iface.errout > 0 ? 'text-red-400' : 'text-slate-500'}>
                                                    {iface.errin + iface.errout}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default StatsPage;
