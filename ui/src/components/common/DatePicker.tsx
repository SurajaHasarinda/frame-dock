import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
    value: string;
    onChange: (date: string) => void;
    required?: boolean;
    label?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, required, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [displayDate, setDisplayDate] = useState(new Date());
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Parse the value or use current date
    const selectedDate = value ? new Date(value) : null;

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

    const formatDate = (date: Date | null) => {
        if (!date) return 'Select date';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatISO = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const handleDateSelect = (day: number) => {
        const newDate = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
        onChange(formatISO(newDate));
        setIsOpen(false);
    };

    const handlePrevMonth = () => {
        setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() + 1));
    };

    const daysInMonth = getDaysInMonth(displayDate.getFullYear(), displayDate.getMonth());
    const firstDay = getFirstDayOfMonth(displayDate.getFullYear(), displayDate.getMonth());
    
    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }
    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const isToday = (day: number) => {
        const today = new Date();
        return today.getDate() === day &&
            today.getMonth() === displayDate.getMonth() &&
            today.getFullYear() === displayDate.getFullYear();
    };

    const isSelected = (day: number) => {
        if (!selectedDate) return false;
        return selectedDate.getDate() === day &&
            selectedDate.getMonth() === displayDate.getMonth() &&
            selectedDate.getFullYear() === displayDate.getFullYear();
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
                <span className={value ? 'text-white' : 'text-slate-500'}>
                    {formatDate(selectedDate)}
                </span>
                <Calendar size={18} className="text-slate-400" />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4">
                    {/* Month/Year Header */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <ChevronLeft size={18} className="text-slate-400" />
                        </button>
                        <div className="text-white font-semibold">
                            {displayDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </div>
                        <button
                            type="button"
                            onClick={handleNextMonth}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <ChevronRight size={18} className="text-slate-400" />
                        </button>
                    </div>

                    {/* Days of Week */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                            <div key={day} className="text-center text-xs text-slate-500 font-medium py-1">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, index) => (
                            <div key={index}>
                                {day ? (
                                    <button
                                        type="button"
                                        onClick={() => handleDateSelect(day)}
                                        className={`w-full aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all
                                            ${isSelected(day)
                                                ? 'bg-docker text-white shadow-lg shadow-docker/20'
                                                : isToday(day)
                                                    ? 'bg-slate-700 text-white ring-2 ring-docker/30'
                                                    : 'text-slate-300 hover:bg-slate-700'
                                            }`}
                                    >
                                        {day}
                                    </button>
                                ) : (
                                    <div className="w-full aspect-square" />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Today Button */}
                    <button
                        type="button"
                        onClick={() => {
                            const today = new Date();
                            onChange(formatISO(today));
                            setIsOpen(false);
                        }}
                        className="w-full mt-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Today
                    </button>
                </div>
            )}
        </div>
    );
};

export default DatePicker;
