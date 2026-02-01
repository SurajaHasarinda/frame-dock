import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';

interface TimePickerProps {
    value: string; // Format: "HH:mm"
    onChange: (time: string) => void;
    required?: boolean;
    label?: string;
}

const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, required, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    // Parse hour and minute from value
    const [hour, minute] = value ? value.split(':').map(Number) : [0, 0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const formatTime = (h: number, m: number) => {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const formatDisplay = (h: number, m: number) => {
        const period = h >= 12 ? 'PM' : 'AM';
        const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${String(displayHour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
    };

    const handleHourChange = (delta: number) => {
        const newHour = (hour + delta + 24) % 24;
        onChange(formatTime(newHour, minute));
    };

    const handleMinuteChange = (delta: number) => {
        const newMinute = (minute + delta + 60) % 60;
        onChange(formatTime(hour, newMinute));
    };

    const handleQuickTime = (h: number, m: number) => {
        onChange(formatTime(h, m));
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {label && (
                <label className="text-xs text-slate-500 mb-1 block">{label}</label>
            )}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-docker transition-all flex items-center justify-between hover:border-slate-600"
            >
                <span className="font-mono text-lg">
                    {formatDisplay(hour, minute)}
                </span>
                <Clock size={18} className="text-slate-400" />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-2 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4">
                    {/* Time Spinner */}
                    <div className="flex items-center justify-center gap-4 mb-4">
                        {/* Hour Spinner */}
                        <div className="flex flex-col items-center">
                            <button
                                type="button"
                                onClick={() => handleHourChange(1)}
                                className="p-1 hover:bg-slate-700 rounded transition-colors"
                            >
                                <ChevronUp size={20} className="text-slate-400" />
                            </button>
                            <div className="w-16 h-16 bg-slate-900 rounded-lg flex items-center justify-center my-2">
                                <span className="text-3xl font-mono font-bold text-white">
                                    {String(hour).padStart(2, '0')}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleHourChange(-1)}
                                className="p-1 hover:bg-slate-700 rounded transition-colors"
                            >
                                <ChevronDown size={20} className="text-slate-400" />
                            </button>
                            <span className="text-xs text-slate-500 mt-1">Hour</span>
                        </div>

                        <span className="text-3xl text-slate-600 font-bold">:</span>

                        {/* Minute Spinner */}
                        <div className="flex flex-col items-center">
                            <button
                                type="button"
                                onClick={() => handleMinuteChange(1)}
                                className="p-1 hover:bg-slate-700 rounded transition-colors"
                            >
                                <ChevronUp size={20} className="text-slate-400" />
                            </button>
                            <div className="w-16 h-16 bg-slate-900 rounded-lg flex items-center justify-center my-2">
                                <span className="text-3xl font-mono font-bold text-white">
                                    {String(minute).padStart(2, '0')}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleMinuteChange(-1)}
                                className="p-1 hover:bg-slate-700 rounded transition-colors"
                            >
                                <ChevronDown size={20} className="text-slate-400" />
                            </button>
                            <span className="text-xs text-slate-500 mt-1">Minute</span>
                        </div>
                    </div>

                    {/* Quick Time Buttons */}
                    <div className="border-t border-slate-700 pt-3">
                        <div className="text-xs text-slate-500 mb-2 font-medium">Quick Select</div>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { h: 0, m: 0, label: '12:00 AM' },
                                { h: 6, m: 0, label: '6:00 AM' },
                                { h: 8, m: 0, label: '8:00 AM' },
                                { h: 12, m: 0, label: '12:00 PM' },
                                { h: 18, m: 0, label: '6:00 PM' },
                                { h: 22, m: 0, label: '10:00 PM' },
                            ].map(({ h, m, label }) => (
                                <button
                                    key={label}
                                    type="button"
                                    onClick={() => handleQuickTime(h, m)}
                                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all
                                        ${hour === h && minute === m
                                            ? 'bg-docker text-white shadow-lg shadow-docker/20'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 5-Minute Increment Buttons */}
                    <div className="flex gap-2 mt-3">
                        <button
                            type="button"
                            onClick={() => handleMinuteChange(-5)}
                            className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            -5 min
                        </button>
                        <button
                            type="button"
                            onClick={() => handleMinuteChange(5)}
                            className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            +5 min
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimePicker;
