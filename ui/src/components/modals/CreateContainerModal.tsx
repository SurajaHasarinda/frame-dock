import React, { useState } from 'react';
import { X, Plus, Trash2, Loader2 } from 'lucide-react';
import { api } from '../../api';

interface CreateContainerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateContainerModal: React.FC<CreateContainerModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [image, setImage] = useState('');
    const [name, setName] = useState('');
    const [ports, setPorts] = useState<{ containerPort: string; hostPort: string }[]>([]);
    const [envVars, setEnvVars] = useState<{ key: string; value: string }[]>([]);
    const [cpuLimit, setCpuLimit] = useState<number>(1); // CPU cores (1 = 100%)
    const [memoryLimit, setMemoryLimit] = useState<number>(512); // Memory in MB
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAddPort = () => {
        setPorts([...ports, { containerPort: '', hostPort: '' }]);
    };

    const handleRemovePort = (index: number) => {
        setPorts(ports.filter((_, i) => i !== index));
    };

    const handleAddEnvVar = () => {
        setEnvVars([...envVars, { key: '', value: '' }]);
    };

    const handleRemoveEnvVar = (index: number) => {
        setEnvVars(envVars.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const portMappings: Record<string, number> = {};
            ports.forEach(p => {
                if (p.containerPort && p.hostPort) {
                    portMappings[`${p.containerPort}/tcp`] = parseInt(p.hostPort);
                }
            });

            const environment: Record<string, string> = {};
            envVars.forEach(env => {
                if (env.key && env.value) {
                    environment[env.key] = env.value;
                }
            });

            await api.createContainer({
                image,
                name: name || undefined,
                ports: Object.keys(portMappings).length > 0 ? portMappings : undefined,
                environment: Object.keys(environment).length > 0 ? environment : undefined,
                cpu_quota: cpuLimit > 0 ? cpuLimit * 100000 : undefined, // Convert cores to microseconds
                mem_limit: memoryLimit > 0 ? `${memoryLimit}m` : undefined, // Convert to string with unit
            });

            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to create container');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Create New Container</h2>
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

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300">Image *</label>
                        <input
                            type="text"
                            value={image}
                            onChange={(e) => setImage(e.target.value)}
                            placeholder="e.g., nginx:latest, postgres:15"
                            className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-docker transition-all"
                            required
                        />
                        <p className="text-xs text-slate-500">Docker image name with optional tag</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300">Container Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., my-nginx-server (optional)"
                            className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-docker transition-all"
                        />
                        <p className="text-xs text-slate-500">Leave empty for auto-generated name</p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-slate-300">Port Mappings</label>
                            <button
                                type="button"
                                onClick={handleAddPort}
                                className="flex items-center gap-1 text-xs text-docker hover:text-blue-400 transition-colors"
                            >
                                <Plus size={14} /> Add Port
                            </button>
                        </div>
                        {ports.map((port, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    type="text"
                                    value={port.containerPort}
                                    onChange={(e) => {
                                        const newPorts = [...ports];
                                        newPorts[index].containerPort = e.target.value;
                                        setPorts(newPorts);
                                    }}
                                    placeholder="Container port (e.g., 80)"
                                    className="flex-1 bg-slate-800 border border-slate-700 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-docker transition-all"
                                />
                                <input
                                    type="text"
                                    value={port.hostPort}
                                    onChange={(e) => {
                                        const newPorts = [...ports];
                                        newPorts[index].hostPort = e.target.value;
                                        setPorts(newPorts);
                                    }}
                                    placeholder="Host port (e.g., 8080)"
                                    className="flex-1 bg-slate-800 border border-slate-700 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-docker transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemovePort(index)}
                                    className="p-2.5 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-slate-300">Environment Variables</label>
                            <button
                                type="button"
                                onClick={handleAddEnvVar}
                                className="flex items-center gap-1 text-xs text-docker hover:text-blue-400 transition-colors"
                            >
                                <Plus size={14} /> Add Variable
                            </button>
                        </div>
                        {envVars.map((env, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    type="text"
                                    value={env.key}
                                    onChange={(e) => {
                                        const newEnvVars = [...envVars];
                                        newEnvVars[index].key = e.target.value;
                                        setEnvVars(newEnvVars);
                                    }}
                                    placeholder="KEY"
                                    className="flex-1 bg-slate-800 border border-slate-700 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-docker transition-all"
                                />
                                <input
                                    type="text"
                                    value={env.value}
                                    onChange={(e) => {
                                        const newEnvVars = [...envVars];
                                        newEnvVars[index].value = e.target.value;
                                        setEnvVars(newEnvVars);
                                    }}
                                    placeholder="value"
                                    className="flex-1 bg-slate-800 border border-slate-700 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-docker transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveEnvVar(index)}
                                    className="p-2.5 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Resource Limits */}
                    <div className="space-y-4 pt-4 border-t border-slate-800">
                        <h3 className="text-sm font-semibold text-slate-300">Resource Limits (Optional)</h3>

                        {/* CPU Limit */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-400">CPU Cores</label>
                                <span className="text-sm font-mono text-docker">{cpuLimit.toFixed(1)} cores</span>
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
                            <p className="text-xs text-slate-500">Limit CPU usage (0 = unlimited)</p>
                        </div>

                        {/* Memory Limit */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-400">Memory Limit</label>
                                <span className="text-sm font-mono text-docker">
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
                            <p className="text-xs text-slate-500">Limit memory usage (0 = unlimited)</p>
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
                            disabled={loading || !image}
                            className="flex-1 px-4 py-3 bg-docker hover:bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-docker/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Create Container'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateContainerModal;
