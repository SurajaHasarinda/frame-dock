import React, { useEffect, useState } from 'react';
import {
    Play,
    Square,
    RotateCcw,
    Trash2,
    Plus,
    Search,
    RefreshCw,
    Activity,
    Filter,
    Box,
    Layers,
    Terminal,
    Settings
} from 'lucide-react';
import { api } from '../api';
import { Container, ContainerStatus } from '../types';
import CreateContainerModal from '../components/modals/CreateContainerModal';
import EditContainerModal from '../components/modals/EditContainerModal';
import ContainerStatsModal from '../components/modals/ContainerStatsModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Snackbar, { SnackbarType } from '../components/common/Snackbar';

const ContainersPage: React.FC = () => {
    const [containers, setContainers] = useState<Container[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showRunningOnly, setShowRunningOnly] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
    const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
    
    // Confirmation dialog state
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        action: '' as 'start' | 'stop' | 'restart' | 'delete' | '',
        containerId: '',
    });

    // Snackbar state
    const [snackbar, setSnackbar] = useState({
        isOpen: false,
        message: '',
        type: 'success' as SnackbarType,
    });

    const fetchContainers = async () => {
        setLoading(true);
        try {
            const data = await api.getContainers();
            setContainers(data);
        } catch (error) {
            console.error('Failed to fetch containers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContainers();
    }, []);

    const handleAction = async (action: 'start' | 'stop' | 'restart' | 'delete', id: string) => {
        const container = containers.find(c => c.id === id);
        const containerName = container?.name || id.substring(0, 12);

        if (action === 'delete') {
            setConfirmDialog({
                isOpen: true,
                title: 'Delete Container',
                message: `Are you sure you want to delete "${containerName}"? This action cannot be undone.`,
                action,
                containerId: id,
            });
            return;
        }

        try {
            if (action === 'start') await api.startContainer(id);
            else if (action === 'stop') await api.stopContainer(id);
            else if (action === 'restart') await api.restartContainer(id);
            
            setSnackbar({
                isOpen: true,
                message: `Container "${containerName}" ${action}ed successfully`,
                type: 'success',
            });
            fetchContainers();
        } catch (error: any) {
            console.error(`Failed to ${action} container:`, error);
            setSnackbar({
                isOpen: true,
                message: error.response?.data?.detail || `Failed to ${action} container`,
                type: 'error',
            });
        }
    };

    const handleConfirmAction = async () => {
        const { action, containerId } = confirmDialog;
        setConfirmDialog({ ...confirmDialog, isOpen: false });

        const container = containers.find(c => c.id === containerId);
        const containerName = container?.name || containerId.substring(0, 12);

        try {
            if (action === 'delete') {
                await api.deleteContainer(containerId, true);
            }
            
            setSnackbar({
                isOpen: true,
                message: `Container "${containerName}" ${action}d successfully`,
                type: 'success',
            });
            fetchContainers();
        } catch (error: any) {
            console.error(`Failed to ${action} container:`, error);
            setSnackbar({
                isOpen: true,
                message: error.response?.data?.detail || `Failed to ${action} container`,
                type: 'error',
            });
        }
    };

    const filtered = containers.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.id.includes(search);
        const matchesFilter = showRunningOnly ? c.status === ContainerStatus.RUNNING : true;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Containers</h2>
                    <p className="text-slate-400 text-sm">Manage and monitor your running instances.</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchContainers}
                        className="p-2.5 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Refresh list"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-docker hover:bg-blue-600 text-white rounded-lg font-semibold shadow-lg shadow-docker/20 transition-all active:scale-[0.98]"
                    >
                        <Plus size={18} />
                        Create Container
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">
                <div className="md:col-span-8 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Filter by name or ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-docker/50 transition-all"
                    />
                </div>
                <div className="md:col-span-4 flex items-center justify-end gap-3">
                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg">
                        <span className="text-xs font-medium text-slate-400">Status</span>
                        <button
                            onClick={() => setShowRunningOnly(!showRunningOnly)}
                            className={`text-xs px-2 py-1 rounded transition-colors ${showRunningOnly ? 'bg-docker/20 text-docker' : 'hover:bg-slate-800 text-slate-400'}`}
                        >
                            Running Only
                        </button>
                    </div>
                    <button className="p-2.5 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-lg">
                        <Filter size={18} />
                    </button>
                </div>
            </div>

            {/* Container List */}
            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-4">
                        <RefreshCw size={48} className="animate-spin opacity-20" />
                        <p className="animate-pulse">Fetching container status...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-20 text-center bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl">
                        <Box size={48} className="mx-auto text-slate-700 mb-4" />
                        <h3 className="text-lg font-medium text-slate-300">No containers found</h3>
                        <p className="text-sm text-slate-500 mt-1">Try adjusting your filters or create a new container.</p>
                    </div>
                ) : (
                    filtered.map(container => (
                        <div key={container.id} className="group bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-all shadow-sm hover:shadow-md">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${container.status === ContainerStatus.RUNNING ? 'bg-success/10 text-success' : 'bg-slate-800 text-slate-500'
                                        }`}>
                                        <Box size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-bold text-white group-hover:text-docker transition-colors">{container.name}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${container.status === ContainerStatus.RUNNING
                                                ? 'bg-success/10 text-success'
                                                : 'bg-danger/10 text-danger'
                                                }`}>
                                                {container.status}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                            <span className="text-xs text-slate-500 flex items-center gap-1.5">
                                                <Layers size={12} /> {container.image}
                                            </span>
                                            <span className="text-xs text-slate-500 flex items-center gap-1.5">
                                                <Terminal size={12} /> ID: <code className="bg-slate-800 px-1 rounded">{container.id.substring(0, 12)}</code>
                                            </span>
                                            {container.ports && container.ports.length > 0 && (
                                                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                                                    <Activity size={12} /> {container.ports.join(', ')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-2 border-t md:border-t-0 pt-4 md:pt-0 border-slate-800">
                                    <div className="flex gap-1.5">
                                        {container.status === ContainerStatus.RUNNING ? (
                                            <button
                                                onClick={() => handleAction('stop', container.id)}
                                                className="p-2 text-warning hover:bg-warning/10 rounded-lg transition-colors"
                                                title="Stop"
                                            >
                                                <Square size={18} fill="currentColor" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleAction('start', container.id)}
                                                className="p-2 text-success hover:bg-success/10 rounded-lg transition-colors"
                                                title="Start"
                                            >
                                                <Play size={18} fill="currentColor" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleAction('restart', container.id)}
                                            className="p-2 text-docker hover:bg-docker/10 rounded-lg transition-colors"
                                            title="Restart"
                                        >
                                            <RotateCcw size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleAction('delete', container.id)}
                                            className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <div className="w-px h-6 bg-slate-800 hidden md:block"></div>
                                    <button
                                        onClick={() => {
                                            setSelectedContainer(container);
                                            setIsEditModalOpen(true);
                                        }}
                                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                        title="Edit Resources"
                                    >
                                        <Settings size={18} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedContainer(container);
                                            setIsStatsModalOpen(true);
                                        }}
                                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                        title="Stats"
                                    >
                                        <Activity size={18} />
                                    </button>
                                </div>
                            </div>

                            {container.status === ContainerStatus.RUNNING && container.cpuUsage !== undefined && (
                                <div className="mt-4 pt-4 border-t border-slate-800/50 flex flex-wrap gap-x-8 gap-y-2">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">CPU Usage</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-docker" style={{ width: `${Math.min(container.cpuUsage * 10, 100)}%` }}></div>
                                            </div>
                                            <span className="text-xs font-mono text-slate-300">{container.cpuUsage}%</span>
                                        </div>
                                    </div>
                                    {container.memoryUsage && (
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Memory</span>
                                            <span className="text-xs font-mono text-slate-300">{container.memoryUsage}</span>
                                        </div>
                                    )}
                                    {container.networkIO && (
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Network IO</span>
                                            <span className="text-xs font-mono text-slate-300">{container.networkIO}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {isCreateModalOpen && (
                <CreateContainerModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={() => {
                        setIsCreateModalOpen(false);
                        setSnackbar({
                            isOpen: true,
                            message: 'Container created successfully',
                            type: 'success',
                        });
                        fetchContainers();
                    }}
                />
            )}

            {isEditModalOpen && selectedContainer && (
                <EditContainerModal
                    isOpen={isEditModalOpen}
                    container={selectedContainer}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setSelectedContainer(null);
                    }}
                    onSuccess={() => {
                        setIsEditModalOpen(false);
                        setSelectedContainer(null);
                        setSnackbar({
                            isOpen: true,
                            message: 'Container resources updated successfully',
                            type: 'success',
                        });
                        fetchContainers();
                    }}
                />
            )}

            {isStatsModalOpen && selectedContainer && (
                <ContainerStatsModal
                    isOpen={isStatsModalOpen}
                    containerId={selectedContainer.id}
                    containerName={selectedContainer.name}
                    onClose={() => {
                        setIsStatsModalOpen(false);
                        setSelectedContainer(null);
                    }}
                />
            )}

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                variant="danger"
                confirmText="Delete"
                onConfirm={handleConfirmAction}
                onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
            />

            <Snackbar
                isOpen={snackbar.isOpen}
                message={snackbar.message}
                type={snackbar.type}
                onClose={() => setSnackbar({ ...snackbar, isOpen: false })}
            />
        </div>
    );
};

export default ContainersPage;
