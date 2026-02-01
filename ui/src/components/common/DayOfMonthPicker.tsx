import React, { useState, useRef, useEffect } from 'react';
import { CalendarIcon, ChevronDown } from 'lucide-react';

interface DayOfMonthPickerProps {
    value: string;
    onChange: (day: string) => void;
    required?: boolean;
    label?: string;
}

const DayOfMonthPicker: React.FC<DayOfMonthPickerProps> = ({ value, onChange, required, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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

    const handleDaySelect = (day: number) => {
        onChange(day.toString());
        setIsOpen(false);
    };

    const getOrdinalSuffix = (day: number) => {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    };

    const formatDay = (day: string) => {
        const dayNum = parseInt(day);
        return `${dayNum}${getOrdinalSuffix(dayNum)} of each month`;
    };

    const days = Array.from({ length: 31 }, (_, i) => i + 1);

    return (
        <div className="relative" ref={dropdownRef}>
            {label && (
                <label className="text-sm font-semibold text-slate-300 mb-2 block">{label}</label>
            )}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-docker transition-all flex items-center justify-between hover:border-slate-600"
            >
                <span className={value ? 'text-white' : 'text-slate-500'}>
                    {value ? formatDay(value) : 'Select day of month'}
                </span>
                <ChevronDown size={18} className="text-slate-400" />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-2 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4">
                    <div className="text-xs text-slate-500 mb-3 font-medium flex items-center gap-2">
                        <CalendarIcon size={14} />
                        Select Day of Month
                    </div>
                    
                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1.5 mb-3">
                        {days.map(day => (
                            <button
                                key={day}
                                type="button"
                                onClick={() => handleDaySelect(day)}
                                className={`aspect-square flex items-center justify-center rounded-lg text-sm font-semibold transition-all
                                    ${parseInt(value) === day
                                        ? 'bg-docker text-white shadow-lg shadow-docker/30 scale-105'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:scale-105'
                                    }`}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DayOfMonthPicker;
