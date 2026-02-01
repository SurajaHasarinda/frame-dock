import React, { useEffect, useState } from 'react';
import { Plus, Trash2, RefreshCw, Calendar, Clock, Power, ToggleLeft, ToggleRight, Edit, AlertTriangle } from 'lucide-react';
import { api } from '@/api';
import { Schedule, Container } from '@/types';
import CreateScheduleModal from '@/components/modals/CreateScheduleModal';
import EditScheduleModal from '@/components/modals/EditScheduleModal';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Snackbar, { SnackbarType } from '@/components/common/Snackbar';

const SchedulesPage: React.FC = () => {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [containers, setContainers] = useState<Container[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

    // Confirmation dialog state
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        scheduleId: 0,
        scheduleName: '',
    });

    // Snackbar state
    const [snackbar, setSnackbar] = useState({
        isOpen: false,
        message: '',
        type: 'success' as SnackbarType,
    });

    const fetchSchedules = async () => {
        setLoading(true);
        try {
            const [schedulesData, containersData] = await Promise.all([
                api.getSchedules(),
                api.getContainers(true)
            ]);
            setSchedules(schedulesData);
            setContainers(containersData);
        } catch (error) {
            console.error('Failed to fetch schedules:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedules();
    }, []);

    const handleToggle = async (id: number) => {
        try {
            await api.toggleSchedule(id);
            const schedule = schedules.find(s => s.id === id);
            setSnackbar({
                isOpen: true,
                message: `Schedule ${schedule?.is_active ? 'disabled' : 'enabled'} successfully`,
                type: 'success',
            });
            fetchSchedules();
        } catch (error: any) {
            console.error('Failed to toggle schedule:', error);
            const errorMessage = typeof error.response?.data?.detail === 'string' 
                ? error.response.data.detail
                : Array.isArray(error.response?.data?.detail)
                ? error.response.data.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ')
                : 'Failed to toggle schedule';
            setSnackbar({
                isOpen: true,
                message: errorMessage,
                type: 'error',
            });
        }
    };

    const handleDelete = async (id: number) => {
        const schedule = schedules.find(s => s.id === id);
        setConfirmDialog({
            isOpen: true,
            scheduleId: id,
            scheduleName: schedule?.schedule_name || 'this schedule',
        });
    };

    const handleConfirmDelete = async () => {
        const { scheduleId, scheduleName } = confirmDialog;
        setConfirmDialog({ ...confirmDialog, isOpen: false });

        try {
            await api.deleteSchedule(scheduleId);
            setSnackbar({
                isOpen: true,
                message: `Schedule for "${scheduleName}" deleted successfully`,
                type: 'success',
            });
            fetchSchedules();
        } catch (error: any) {
            console.error('Failed to delete schedule:', error);
            const errorMessage = typeof error.response?.data?.detail === 'string' 
                ? error.response.data.detail
                : Array.isArray(error.response?.data?.detail)
                ? error.response.data.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ')
                : 'Failed to delete schedule';
            setSnackbar({
                isOpen: true,
                message: errorMessage,
                type: 'error',
            });
        }
    };

    const getActionColor = (action: string) => {
        switch (action.toLowerCase()) {
            case 'start': return 'text-success bg-success/10';
            case 'stop': return 'text-warning bg-warning/10';
            case 'restart': return 'text-docker bg-docker/10';
            case 'sleep': return 'text-purple-400 bg-purple-400/10';
            default: return 'text-slate-400 bg-slate-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Schedules</h2>
                    <p className="text-slate-400 text-sm">Automate container actions with scheduled tasks.</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchSchedules}
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
                        Create Schedule
                    </button>
                </div>
            </div>

            {/* Schedule List */}
            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-4">
                        <RefreshCw size={48} className="animate-spin opacity-20" />
                        <p className="animate-pulse">Loading schedules...</p>
                    </div>
                ) : schedules.length === 0 ? (
                    <div className="py-20 text-center bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl">
                        <Calendar size={48} className="mx-auto text-slate-700 mb-4" />
                        <h3 className="text-lg font-medium text-slate-300">No schedules configured</h3>
                        <p className="text-sm text-slate-500 mt-1">Create your first automated schedule to get started.</p>
                    </div>
                ) : (
                    schedules.map(schedule => {
                        // Get container details
                        const scheduleContainers = schedule.container_ids
                            .map(id => containers.find(c => c.id === id))
                            .filter(c => c !== undefined) as Container[];
                        const missingCount = schedule.container_ids.length - scheduleContainers.length;
                        const isGrouped = schedule.container_ids.length > 1;
                        
                        // Build display name
                        const displayName = scheduleContainers.length === 0
                            ? 'No containers'
                            : scheduleContainers.length === 1
                            ? scheduleContainers[0].name
                            : `${scheduleContainers.map(c => c.name).join(', ')}`;
                        
                        return (
                            <div key={schedule.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-all">
                                {missingCount > 0 && (
                                    <div className="mb-4 flex items-center gap-2 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                                        <AlertTriangle size={16} className="text-warning flex-shrink-0" />
                                        <span className="text-sm text-warning">Warning: {missingCount} container{missingCount > 1 ? 's' : ''} no longer exist{missingCount === 1 ? 's' : ''}.</span>
                                    </div>
                                )}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="p-3 rounded-xl bg-slate-800">
                                            <Calendar size={24} className="text-docker" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h3 className="text-lg font-bold text-white">{displayName}</h3>
                                                {isGrouped && (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400">
                                                        Group ({schedule.container_ids.length})
                                                    </span>
                                                )}
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getActionColor(schedule.action)}`}>
                                                    {schedule.action}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${schedule.is_active ? 'bg-success/10 text-success' : 'bg-slate-800 text-slate-500'
                                                    }`}>
                                                    {schedule.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                                                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                                                    <Clock size={12} />
                                                    {schedule.action === 'sleep' && schedule.wake_time_expression ? (
                                                        <>
                                                            {schedule.schedule_type}: Sleep: {schedule.time_expression} → Wake: {schedule.wake_time_expression}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {schedule.schedule_type}: {schedule.time_expression}
                                                        </>
                                                    )}
                                                </span>

                                                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                                                    <Power size={12} /> Containers: <code className="bg-slate-800 px-1 rounded">{schedule.container_ids.length}</code>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleToggle(schedule.id)}
                                            className={`p-2 rounded-lg transition-colors ${schedule.is_active
                                                ? 'text-success hover:bg-success/10'
                                                : 'text-slate-500 hover:bg-slate-800'
                                                }`}
                                            title={schedule.is_active ? 'Disable' : 'Enable'}
                                        >
                                            {schedule.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedSchedule(schedule);
                                                setIsEditModalOpen(true);
                                            }}
                                            className="p-2 text-docker hover:bg-docker/10 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(schedule.id)}
                                            className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {
                isCreateModalOpen && (
                    <CreateScheduleModal
                        isOpen={isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                        onSuccess={() => {
                            setIsCreateModalOpen(false);
                            setSnackbar({
                                isOpen: true,
                                message: 'Schedule created successfully',
                                type: 'success',
                            });
                            fetchSchedules();
                        }}
                    />
                )
            }

            {
                isEditModalOpen && selectedSchedule && (
                    <EditScheduleModal
                        isOpen={isEditModalOpen}
                        schedule={selectedSchedule}
                        onClose={() => {
                            setIsEditModalOpen(false);
                            setSelectedSchedule(null);
                        }}
                        onSuccess={() => {
                            setIsEditModalOpen(false);
                            setSelectedSchedule(null);
                            setSnackbar({
                                isOpen: true,
                                message: 'Schedule updated successfully',
                                type: 'success',
                            });
                            fetchSchedules();
                        }}
                    />
                )
            }

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title="Delete Schedule"
                message={`Are you sure you want to delete the schedule for "${confirmDialog.scheduleName}"? This action cannot be undone.`}
                variant="danger"
                confirmText="Delete"
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
            />

            <Snackbar
                isOpen={snackbar.isOpen}
                message={snackbar.message}
                type={snackbar.type}
                onClose={() => setSnackbar({ ...snackbar, isOpen: false })}
            />
        </div >
    );
};

export default SchedulesPage;
