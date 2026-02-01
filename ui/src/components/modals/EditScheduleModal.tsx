import React, { useState, useEffect } from 'react';
import {
    X,
    Loader2,
    Clock,
    Calendar as CalendarIcon,
    CalendarDays,
    CalendarRange,
    CalendarClock,
    Play,
    Square,
    RotateCcw,
    Moon,
    Check
} from 'lucide-react';
import { api } from '../../api';
import { Container, Schedule } from '../../types';
import DatePicker from '../common/DatePicker';
import TimePicker from '../common/TimePicker';
import DayOfMonthPicker from '../common/DayOfMonthPicker';

interface EditScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    schedule: Schedule;
}

const EditScheduleModal: React.FC<EditScheduleModalProps> = ({ isOpen, onClose, onSuccess, schedule }) => {
    const [containers, setContainers] = useState<Container[]>([]);
    const [selectedContainers, setSelectedContainers] = useState<string[]>(schedule.container_ids);
    const [scheduleType, setScheduleType] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>(schedule.schedule_type);
    const [action, setAction] = useState<'start' | 'stop' | 'restart' | 'sleep'>(schedule.action);

    // Parse initial time from schedule
    const parseTime = (expr: string, type: string) => {
        if (type === 'daily') {
            const [h, m] = expr.split(':');
            return { hour: h, minute: m, day: 'mon', date: '1' };
        } else if (type === 'weekly') {
            const [day, time] = expr.split(' ');
            const [h, m] = time.split(':');
            return { hour: h, minute: m, day, date: '1' };
        } else if (type === 'monthly') {
            const [date, time] = expr.split(' ');
            const [h, m] = time.split(':');
            return { hour: h, minute: m, day: 'mon', date };
        }
        return { hour: '00', minute: '00', day: 'mon', date: '1' };
    };

    const initialTime = parseTime(schedule.time_expression, schedule.schedule_type);
    const initialWakeTime = schedule.wake_time_expression
        ? parseTime(schedule.wake_time_expression, schedule.schedule_type)
        : { hour: '00', minute: '00', day: 'mon', date: '1' };

    const [hour, setHour] = useState(initialTime.hour);
    const [minute, setMinute] = useState(initialTime.minute);
    const [wakeHour, setWakeHour] = useState(initialWakeTime.hour);
    const [wakeMinute, setWakeMinute] = useState(initialWakeTime.minute);
    const [selectedDay, setSelectedDay] = useState(initialTime.day);
    const [selectedDate, setSelectedDate] = useState(initialTime.date);

    // Custom datetime
    const [customDate, setCustomDate] = useState('');
    const [customTime, setCustomTime] = useState('');
    const [customWakeDate, setCustomWakeDate] = useState('');
    const [customWakeTime, setCustomWakeTime] = useState('');

    const [isActive, setIsActive] = useState(schedule.is_active);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const dayLabels = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };

    useEffect(() => {
        const fetchContainers = async () => {
            try {
                const data = await api.getContainers();
                setContainers(data);
                
                // Filter out deleted containers from selectedContainers
                const existingContainerIds = data.map(c => c.id);
                const validSelectedContainers = schedule.container_ids.filter(id => 
                    existingContainerIds.includes(id)
                );
                setSelectedContainers(validSelectedContainers);
            } catch (error) {
                console.error('Failed to fetch containers:', error);
            }
        };
        if (isOpen) {
            fetchContainers();

            // Parse custom datetime if needed
            if (schedule.schedule_type === 'custom') {
                const [date, time] = schedule.time_expression.split(' ');
                setCustomDate(date);
                setCustomTime(time.substring(0, 5)); // Remove seconds

                if (schedule.wake_time_expression) {
                    const [wakeDate, wakeTime] = schedule.wake_time_expression.split(' ');
                    setCustomWakeDate(wakeDate);
                    setCustomWakeTime(wakeTime.substring(0, 5));
                }
            }
        }
    }, [isOpen, schedule]);

    const buildTimeExpression = () => {
        if (scheduleType === 'daily') {
            return `${hour}:${minute}`;
        } else if (scheduleType === 'weekly') {
            return `${selectedDay} ${hour}:${minute}`;
        } else if (scheduleType === 'monthly') {
            return `${selectedDate} ${hour}:${minute}`;
        } else {
            return `${customDate} ${customTime}:00`;
        }
    };

    const buildWakeTimeExpression = () => {
        if (scheduleType === 'custom') {
            return `${customWakeDate} ${customWakeTime}:00`;
        }
        return `${wakeHour}:${wakeMinute}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (selectedContainers.length === 0) {
                throw new Error('Please select at least one container');
            }

            const selectedContainersList = containers.filter(c => selectedContainers.includes(c.id));
            
            // Generate descriptive schedule name
            const actionLabel = action.charAt(0).toUpperCase() + action.slice(1);
            const scheduleTypeSuffix = scheduleType === 'daily' ? 'Daily' : 
                                      scheduleType === 'weekly' ? 'Weekly' : 
                                      scheduleType === 'monthly' ? 'Monthly' : 'Once';
            const scheduleName = selectedContainersList.length === 1
                ? `${actionLabel} ${selectedContainersList[0].name} (${scheduleTypeSuffix})`
                : `${actionLabel} ${selectedContainersList.length} Containers (${scheduleTypeSuffix})`;

            const timeExpression = buildTimeExpression();
            const wakeTimeExpression = action === 'sleep' ? buildWakeTimeExpression() : undefined;

            await api.updateSchedule(schedule.id, {
                container_ids: selectedContainers,
                schedule_name: scheduleName,
                schedule_type: scheduleType,
                action,
                time_expression: timeExpression,
                wake_time_expression: wakeTimeExpression,
                is_active: isActive,
            });

            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to update schedule');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between z-10">
                    <h2 className="text-xl font-bold text-white">Edit Schedule</h2>
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

                    {/* Container Selection (Multi-select) */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300">Containers ({selectedContainers.length}) *</label>
                        <div className="border border-slate-700 rounded-xl overflow-hidden">
                            <div className="max-h-40 overflow-y-auto bg-slate-800 p-2 space-y-1 custom-scrollbar">
                                {containers.map(container => (
                                    <div
                                        key={container.id}
                                        onClick={() => {
                                            if (selectedContainers.includes(container.id)) {
                                                setSelectedContainers(selectedContainers.filter(id => id !== container.id));
                                            } else {
                                                setSelectedContainers([...selectedContainers, container.id]);
                                            }
                                        }}
                                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedContainers.includes(container.id)
                                            ? 'bg-docker/20 text-white border border-docker/50'
                                            : 'text-slate-400 border border-transparent hover:bg-slate-700 hover:text-white'
                                            }`}
                                    >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedContainers.includes(container.id)
                                            ? 'border-docker bg-docker'
                                            : 'border-slate-500'
                                            }`}>
                                            {selectedContainers.includes(container.id) && <Check size={12} className="text-white" />}
                                        </div>
                                        <span className="truncate text-sm font-medium">
                                            {container.name || container.id.substring(0, 12)}
                                        </span>
                                    </div>
                                ))}
                                {containers.length === 0 && (
                                    <p className="text-center text-slate-500 py-4 text-sm">No containers available</p>
                                )}
                            </div>
                        </div>
                        <p className="text-xs text-slate-500">Select one or more containers to schedule together</p>
                    </div>

                    {/* Action Selection - Button Group */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300">Action *</label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { value: 'start', label: 'Start', color: 'success', icon: Play },
                                { value: 'stop', label: 'Stop', color: 'warning', icon: Square },
                                { value: 'restart', label: 'Restart', color: 'docker', icon: RotateCcw },
                                { value: 'sleep', label: 'Sleep', color: 'purple-400', icon: Moon }
                            ].map(({ value, label, color, icon: Icon }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setAction(value as any)}
                                    className={`px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${action === value
                                        ? `bg-${color}/20 text-${color} border-2 border-${color} shadow-lg shadow-${color}/20`
                                        : 'bg-slate-800 text-slate-400 border-2 border-slate-700 hover:border-slate-600 hover:bg-slate-750'
                                        }`}
                                >
                                    <Icon size={18} />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Schedule Type - Button Group */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300">Schedule Type *</label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { value: 'daily', label: 'Daily', icon: CalendarDays },
                                { value: 'weekly', label: 'Weekly', icon: CalendarRange },
                                { value: 'monthly', label: 'Monthly', icon: CalendarIcon },
                                { value: 'custom', label: 'Custom', icon: CalendarClock }
                            ].map(({ value, label, icon: Icon }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setScheduleType(value as any)}
                                    className={`px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${scheduleType === value
                                        ? 'bg-docker/20 text-docker border-2 border-docker shadow-lg shadow-docker/20'
                                        : 'bg-slate-800 text-slate-400 border-2 border-slate-700 hover:border-slate-600 hover:bg-slate-750'
                                        }`}
                                >
                                    <Icon size={18} />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Weekly: Day Selection */}
                    {scheduleType === 'weekly' && (
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300">Day of Week *</label>
                            <div className="grid grid-cols-7 gap-1">
                                {days.map(day => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => setSelectedDay(day)}
                                        className={`px-2 py-2 rounded-lg font-medium text-xs transition-all ${selectedDay === day
                                            ? 'bg-docker text-white'
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                            }`}
                                        title={dayLabels[day as keyof typeof dayLabels]}
                                    >
                                        {day.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Monthly: Date Selection */}
                    {scheduleType === 'monthly' && (
                        <DayOfMonthPicker
                            value={selectedDate}
                            onChange={setSelectedDate}
                            required
                            label="Day of Month *"
                        />
                    )}

                    {/* Time Selection (Daily/Weekly/Monthly) */}
                    {scheduleType !== 'custom' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                    <Clock size={16} />
                                    {action === 'sleep' ? 'Sleep Time (Stop Container) *' : 'Time *'}
                                </label>
                                <TimePicker
                                    value={`${hour}:${minute}`}
                                    onChange={(time) => {
                                        const [h, m] = time.split(':');
                                        setHour(h);
                                        setMinute(m);
                                    }}
                                    required
                                />
                            </div>

                            {action === 'sleep' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                        <Clock size={16} />
                                        Wake Time (Start Container) *
                                    </label>
                                    <TimePicker
                                        value={`${wakeHour}:${wakeMinute}`}
                                        onChange={(time) => {
                                            const [h, m] = time.split(':');
                                            setWakeHour(h);
                                            setWakeMinute(m);
                                        }}
                                        required
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Custom DateTime */}
                    {scheduleType === 'custom' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                    <CalendarIcon size={16} />
                                    {action === 'sleep' ? 'Sleep Date & Time *' : 'Date & Time *'}
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <DatePicker
                                        value={customDate}
                                        onChange={setCustomDate}
                                        required
                                        label="Date"
                                    />
                                    <TimePicker
                                        value={customTime}
                                        onChange={setCustomTime}
                                        required
                                        label="Time"
                                    />
                                </div>
                            </div>

                            {action === 'sleep' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                        <CalendarIcon size={16} />
                                        Wake Date & Time *
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <DatePicker
                                            value={customWakeDate}
                                            onChange={setCustomWakeDate}
                                            required
                                            label="Date"
                                        />
                                        <TimePicker
                                            value={customWakeTime}
                                            onChange={setCustomWakeTime}
                                            required
                                            label="Time"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Active Toggle */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-800/50 rounded-xl border-2 border-slate-700 hover:border-slate-600 transition-colors">
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-docker focus:ring-2 focus:ring-docker"
                            />
                            <div className="flex-1">
                                <span className="text-sm font-semibold text-slate-300 block">
                                    Active Schedule
                                </span>
                                <span className="text-xs text-slate-500">
                                    Schedule will run at specified times when enabled
                                </span>
                            </div>
                        </label>
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
                            disabled={loading || selectedContainers.length === 0}
                            className="flex-1 px-4 py-3 bg-docker hover:bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-docker/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Update Schedule'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditScheduleModal;
