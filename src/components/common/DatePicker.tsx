import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse the value to a Date object
  const selectedDate = value ? new Date(value + 'T00:00:00') : null;

  // Days of week starting with Saturday
  const daysOfWeek = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const weekendDays = [0, 1]; // Saturday and Sunday indices

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get the first day of the month
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  // Get the last day of the month
  const getLastDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  };

  // Get all days to display in the calendar (including padding days)
  const getCalendarDays = () => {
    const firstDay = getFirstDayOfMonth(viewDate);
    const lastDay = getLastDayOfMonth(viewDate);
    const days: (Date | null)[] = [];

    // Get the day of week for the first day (0 = Sunday, 6 = Saturday)
    let firstDayOfWeek = firstDay.getDay();
    // Adjust to start week on Saturday (Saturday = 0, Sunday = 1, etc.)
    firstDayOfWeek = (firstDayOfWeek + 1) % 7;

    // Add padding days from previous month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), i));
    }

    // Add padding days to complete the last week
    while (days.length % 7 !== 0) {
      days.push(null);
    }

    return days;
  };

  // Format date for display
  const formatDisplayDate = (date: Date | null) => {
    if (!date) return placeholder;
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-AU', options);
  };

  // Format date for value (YYYY-MM-DD)
  const formatValueDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    onChange(formatValueDate(date));
    setIsOpen(false);
  };

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Check if a date is selected
  const isDateSelected = (date: Date) => {
    if (!selectedDate || !date) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  // Check if a date is today
  const isToday = (date: Date) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Check if a day is weekend (adjusted for Saturday start)
  const isWeekend = (date: Date | null, index: number) => {
    if (!date) return weekendDays.includes(index % 7);
    return weekendDays.includes(index % 7);
  };

  const calendarDays = getCalendarDays();

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input Field */}
      <div className="relative">
        <input
          type="text"
          value={formatDisplayDate(selectedDate)}
          onClick={() => setIsOpen(!isOpen)}
          readOnly
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E5E5FF] focus:border-transparent transition-all cursor-pointer bg-white"
        />
        <Calendar 
          className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" 
        />
      </div>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-4 min-w-[320px]">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h3 className="text-sm font-semibold text-gray-900">
              {viewDate.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map((day, index) => (
              <div
                key={day}
                className={`text-xs font-medium text-center py-1 ${
                  weekendDays.includes(index) ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="p-2" />;
              }

              const weekend = isWeekend(date, index);
              const selected = isDateSelected(date);
              const today = isToday(date);

              return (
                <button
                  key={`${date.getMonth()}-${date.getDate()}`}
                  onClick={() => handleDateSelect(date)}
                  className={`
                    p-2 text-sm rounded-lg transition-all
                    ${selected 
                      ? 'bg-[#5469D4] text-white font-semibold' 
                      : weekend
                        ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        : 'hover:bg-gray-100 text-gray-700'
                    }
                    ${today && !selected ? 'ring-2 ring-[#5469D4] ring-opacity-50' : ''}
                  `}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Today Button */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <button
              onClick={() => {
                const today = new Date();
                handleDateSelect(today);
              }}
              className="w-full py-2 text-sm font-medium text-[#5469D4] hover:bg-[#E5E5FF] rounded-lg transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;