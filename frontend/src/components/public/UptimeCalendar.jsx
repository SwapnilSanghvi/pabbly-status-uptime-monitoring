import { formatTimestampWithTZ } from '../../utils/timezone';

export default function UptimeCalendar({ logs, timezone, onDayHover, onDayClick }) {
  // Safety check for logs
  if (!logs || !Array.isArray(logs)) {
    return (
      <div className="text-center py-8 text-gray-500">
        No calendar data available
      </div>
    );
  }

  // Generate calendar months (last 3 months including current)
  const generateCalendarMonths = () => {
    const months = [];
    const today = new Date();

    // Generate 3 months (2 months ago, 1 month ago, current month)
    for (let i = 2; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();

      // Get first day of month and last day
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      // Get day of week for first day (0 = Sunday)
      const startDayOfWeek = firstDay.getDay();

      // Generate all days in the month
      const days = [];
      const totalDays = lastDay.getDate();

      // Add empty cells for days before month starts
      for (let j = 0; j < startDayOfWeek; j++) {
        days.push(null);
      }

      // Add all days of the month
      for (let day = 1; day <= totalDays; day++) {
        days.push(new Date(year, month, day));
      }

      months.push({
        name: firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        shortName: firstDay.toLocaleDateString('en-US', { month: 'long' }),
        days,
      });
    }

    return months;
  };

  // Get log data for a specific date
  const getLogForDate = (date) => {
    if (!date || !logs || logs.length === 0) return null;

    // Format the date to match with log bucket_start
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

    return logs.find(log => {
      if (!log || !log.bucket_start) return false;

      try {
        const logDate = new Date(log.bucket_start);
        if (isNaN(logDate.getTime())) return false;

        const logDateStr = logDate.toISOString().split('T')[0];
        return logDateStr === dateStr;
      } catch (error) {
        console.error('Error parsing log date:', error, log);
        return false;
      }
    });
  };

  // Determine status color for a day
  const getDayStatus = (date) => {
    if (!date) return null;

    const log = getLogForDate(date);

    if (!log) {
      return 'no-data'; // Gray - no data
    }

    const failedPings = parseInt(log.failed_pings) || 0;

    if (failedPings === 0) {
      return 'success'; // Green - 100% uptime
    } else {
      return 'failure'; // Red - some failures
    }
  };

  // Get CSS class for day cell based on status
  const getDayClass = (status, isToday) => {
    const baseClass = 'w-8 h-8 rounded flex items-center justify-center text-xs font-medium transition-all duration-150';

    if (!status || status === 'no-data') {
      return `${baseClass} bg-gray-200 text-gray-400 cursor-default`;
    }

    if (status === 'success') {
      return `${baseClass} bg-green-500 text-white cursor-pointer hover:bg-green-600 hover:shadow-md`;
    }

    if (status === 'failure') {
      return `${baseClass} bg-red-500 text-white cursor-pointer hover:bg-red-600 hover:shadow-md`;
    }

    return baseClass;
  };

  // Handle day hover
  const handleDayHover = (e, date) => {
    if (!date) {
      onDayHover(null);
      return;
    }

    const log = getLogForDate(date);
    if (!log) {
      onDayHover(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();

    onDayHover({
      log,
      x: rect.left + rect.width / 2,
      y: rect.top,
      bottomY: rect.bottom,
      isCalendarDay: true,
      date,
    });
  };

  // Handle day click (for drill-down)
  const handleDayClick = (date) => {
    if (!date) return;

    const log = getLogForDate(date);
    if (!log) return;

    if (onDayClick) {
      onDayClick(log);
    }
  };

  // Check if date is today
  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const months = generateCalendarMonths();

  return (
    <div className="space-y-8">
      {/* Desktop: 3 columns, Mobile: 1 column stacked */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {months.map((month, monthIndex) => (
          <div key={monthIndex} className="bg-white">
            {/* Month Header */}
            <h4 className="text-sm font-semibold text-gray-900 mb-3 text-center">
              {month.shortName}
            </h4>

            {/* Day Headers (S M T W T F S) */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                <div key={idx} className="text-center text-xs text-gray-500 font-medium">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {month.days.map((date, dayIndex) => {
                if (!date) {
                  // Empty cell for padding
                  return <div key={`empty-${dayIndex}`} className="w-8 h-8"></div>;
                }

                const status = getDayStatus(date);
                const isTodayDate = isToday(date);

                return (
                  <div
                    key={dayIndex}
                    className={getDayClass(status, isTodayDate)}
                    onMouseEnter={(e) => handleDayHover(e, date)}
                    onMouseLeave={() => onDayHover(null)}
                    onClick={() => handleDayClick(date)}
                    title={date.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  >
                    {date.getDate()}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-gray-600 pt-4 border-t">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>100% Uptime</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Downtime/Issues</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-200 rounded"></div>
          <span>No data</span>
        </div>
      </div>

      {/* Info Text */}
      <div className="text-center text-xs text-gray-500">
        Each cell represents 1 day • Hover for details • Click to view minute-by-minute breakdown
      </div>
    </div>
  );
}
