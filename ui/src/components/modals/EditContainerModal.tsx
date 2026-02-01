import React, { useState, useEffect } from 'react';
import { X, Loader2, Cpu, MemoryStick, Info } from 'lucide-react';
import { api } from '../../api';
import { Container } from '../../types';

interface EditContainerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    container: Container;
}

const EditContainerModal: React.FC<EditContainerModalProps> = ({ isOpen, onClose, onSuccess, container }) => {
    const [cpuLimit, setCpuLimit] = useState<number>(1); // CPU cores
    const [memoryLimit, setMemoryLimit] = useState<number>(512); // Memory in MB
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Parse current resource limits from container
    useEffect(() => {
        if (isOpen && container) {
            // Parse CPU limit (if exists)
            const cpuQuota = container.cpu_quota || 0;
            if (cpuQuota > 0) {
                setCpuLimit(cpuQuota / 100000); // Convert microseconds to cores
            } else {
                setCpuLimit(1); // Default
            }

            // Parse memory limit (if exists)
            const memLimit = container.memory_limit;
            if (memLimit) {
                if (typeof memLimit === 'number') {
                    // Docker returns memory in bytes, convert to MB
                    setMemoryLimit(Math.round(memLimit / (1024 * 1024)));
                } else if (typeof memLimit === 'string') {
                    // Handle string format like "512m", "1g"
                    const memMatch = memLimit.match(/^(\d+)([kmg]?)$/i);
                    if (memMatch) {
                        const value = parseInt(memMatch[1]);
                        const unit = memMatch[2].toLowerCase();
                        if (unit === 'g') {
                            setMemoryLimit(value * 1024);
                        } else if (unit === 'k') {
                            setMemoryLimit(Math.round(value / 1024));
                        } else {
                            setMemoryLimit(value);
                        }
                    } else {
                        setMemoryLimit(512); // Default
                    }
                } else {
                    setMemoryLimit(512); // Default
                }
            } else {
                setMemoryLimit(512); // Default
            }
        }
    }, [isOpen, container]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.updateContainerResources(container.id, {
                cpu_quota: cpuLimit > 0 ? cpuLimit * 100000 : undefined,
                mem_limit: memoryLimit > 0 ? `${memoryLimit}m` : undefined,
            });

            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to update container resources');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-xl font-bold text-white">Edit Container Resources</h2>
                        <p className="text-sm text-slate-400 mt-1">{container.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    {/* Info Banner */}
                    <div className="bg-blue-500/10 border border-blue-500/50 text-blue-400 px-4 py-3 rounded-xl text-sm flex items-start gap-3">
                        <Info size={18} className="mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-semibold">Resource Limits</p>
                            <p className="text-xs text-blue-300 mt-1">
                                Update CPU and memory limits for this container. Changes will take effect immediately.
                                Note: Ports and environment variables cannot be changed after creation.
                            </p>
                        </div>
                    </div>

                    {/* Container Info (Read-only) */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                        <div>
                            <label className="text-xs text-slate-500">Container ID</label>
                            <p className="text-sm text-slate-300 font-mono">{container.id.substring(0, 12)}</p>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500">Status</label>
                            <p className={`text-sm font-medium ${container.state === 'running' ? 'text-success' :
                                    container.state === 'exited' ? 'text-slate-400' : 'text-warning'
                                }`}>
                                {container.state ? container.state.charAt(0).toUpperCase() + container.state.slice(1) : 'Unknown'}
                            </p>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500">Image</label>
                            <p className="text-sm text-slate-300 truncate">{container.image}</p>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500">Created</label>
                            <p className="text-sm text-slate-300">{new Date(container.created).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* CPU Limit */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Cpu size={18} className="text-docker" />
                            <h3 className="text-sm font-semibold text-slate-300">CPU Limit</h3>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-400">CPU Cores</label>
                                <span className="text-sm font-mono text-docker bg-docker/10 px-3 py-1 rounded-lg">
                                    {cpuLimit.toFixed(1)} cores
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0.1"
                                max="8"
                                step="0.1"
                                value={cpuLimit}
                                onChange={(e) => setCpuLimit(parseFloat(e.target.value))}
                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-docker"
                            />
                            <div className="flex justify-between text-xs text-slate-600">
                                <span>0.1</span>
                                <span>2</span>
                                <span>4</span>
                                <span>8</span>
                            </div>
                            <p className="text-xs text-slate-500">
                                Limit CPU usage. 1.0 = 100% of one CPU core, 2.0 = 200% (2 cores), etc.
                            </p>
                        </div>
                    </div>

                    {/* Memory Limit */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <MemoryStick size={18} className="text-docker" />
                            <h3 className="text-sm font-semibold text-slate-300">Memory Limit</h3>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-400">RAM Allocation</label>
                                <span className="text-sm font-mono text-docker bg-docker/10 px-3 py-1 rounded-lg">
                                    {memoryLimit >= 1024 ? `${(memoryLimit / 1024).toFixed(1)} GB` : `${memoryLimit} MB`}
                                </span>
                            </div>
                            <input
                                type="range"
                                min="128"
                                max="8192"
                                step="128"
                                value={memoryLimit}
                                onChange={(e) => setMemoryLimit(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-docker"
                            />
                            <div className="flex justify-between text-xs text-slate-600">
                                <span>128MB</span>
                                <span>1GB</span>
                                <span>4GB</span>
                                <span>8GB</span>
                            </div>
                            <p className="text-xs text-slate-500">
                                Maximum memory the container can use. Container will be killed if it exceeds this limit.
                            </p>
                        </div>
                    </div>

                    {/* Current vs New Comparison */}
                    <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700">
                        <h4 className="text-xs font-semibold text-slate-400 mb-3">Summary</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">CPU Limit:</span>
                                <span className="text-docker font-mono">{cpuLimit.toFixed(1)} cores ({(cpuLimit * 100).toFixed(0)}%)</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Memory Limit:</span>
                                <span className="text-docker font-mono">
                                    {memoryLimit >= 1024 ? `${(memoryLimit / 1024).toFixed(2)} GB` : `${memoryLimit} MB`}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-docker hover:bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-docker/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Update Resources'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditContainerModal;
