import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import { X, Loader2, Database, Box } from 'lucide-react';
import { api } from '../../api';
import { ContainerStats } from '../../types';

interface MemoryDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const MemoryDetailsModal: React.FC<MemoryDetailsModalProps> = ({ isOpen, onClose }) => {
    const [stats, setStats] = useState<ContainerStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        try {
            const data = await api.getContainerStatsAll();
            setStats(data);
            setError(null);
        } catch (err: any) {
            console.error(err);
            setError('Failed to fetch container stats');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchStats();
            // Refresh every 3 seconds
            const interval = setInterval(fetchStats, 3000);
            return () => clearInterval(interval);
        }
    }, [isOpen]);

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
                <div className="p-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Database className="text-purple-400" size={24} />
                        Container Memory Usage
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {loading && stats.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                            <Loader2 className="animate-spin mb-2" size={32} />
                            <p>Loading stats...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-400 py-8 bg-red-400/10 rounded-xl border border-red-400/20">{error}</div>
                    ) : stats.length === 0 ? (
                        <div className="text-center text-slate-500 py-12 bg-slate-800/30 rounded-xl border border-dashed border-slate-800">
                            <Box size={32} className="mx-auto mb-2 opacity-50" />
                            <p>No running containers found.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {stats.map((container) => (
                                <div key={container.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all hover:bg-slate-800/30 group">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-slate-800 rounded-lg text-docker group-hover:bg-slate-700 transition-colors">
                                            <Box size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-semibold text-white truncate pr-4" title={container.name}>{container.name}</h3>
                                                <span className="text-slate-500 text-xs font-mono bg-slate-800 px-1.5 py-0.5 rounded">{container.id.substring(0, 12)}</span>
                                            </div>

                                            <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                                                <div
                                                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${container.memory_percent > 90 ? 'bg-red-500' :
                                                        container.memory_percent > 75 ? 'bg-amber-500' :
                                                            'bg-purple-500'
                                                        }`}
                                                    style={{ width: `${Math.min(container.memory_percent, 100)}%` }}
                                                />
                                            </div>

                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400 font-mono">
                                                    {formatBytes(container.memory_usage)} <span className="text-slate-600">/ {formatBytes(container.memory_limit)}</span>
                                                </span>
                                                <span className={`font-bold ${container.memory_percent > 90 ? 'text-red-400' :
                                                    container.memory_percent > 75 ? 'text-amber-400' :
                                                        'text-purple-400'
                                                    }`}>
                                                    {container.memory_percent.toFixed(2)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default MemoryDetailsModal;
