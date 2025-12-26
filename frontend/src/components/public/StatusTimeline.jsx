import { useState } from 'react';

export default function StatusTimeline({ timelineData, services }) {
  const [hoveredDay, setHoveredDay] = useState(null);
  const [selectedService, setSelectedService] = useState('all');

  // Generate 90 days of data for a specific service or all services
  const generateDays = (serviceId = 'all') => {
    const days = [];
    // Use current date in local timezone
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day

    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Format as YYYY-MM-DD in local timezone (not UTC)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      let dayData;
      if (serviceId === 'all') {
        // Aggregate all services - convert backend UTC date to local date
        dayData = timelineData?.find(d => {
          const backendDateObj = new Date(d.date);
          const year = backendDateObj.getFullYear();
          const month = String(backendDateObj.getMonth() + 1).padStart(2, '0');
          const day = String(backendDateObj.getDate()).padStart(2, '0');
          const backendLocalDate = `${year}-${month}-${day}`;
          return backendLocalDate === dateStr;
        });
      } else {
        // Filter by specific service - convert backend UTC date to local date
        dayData = timelineData?.find(d => {
          const backendDateObj = new Date(d.date);
          const year = backendDateObj.getFullYear();
          const month = String(backendDateObj.getMonth() + 1).padStart(2, '0');
          const day = String(backendDateObj.getDate()).padStart(2, '0');
          const backendLocalDate = `${year}-${month}-${day}`;
          return backendLocalDate === dateStr && d.api_id === serviceId;
        });
      }

      days.push({
        date: dateStr,
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        uptime: dayData?.uptime_percentage || null,
        hasData: !!dayData,
      });
    }

    return days;
  };

  const days = generateDays(selectedService);

  const getColor = (uptime) => {
    if (uptime === null) return 'bg-gray-200'; // No data
    if (uptime === 100) return 'bg-green-500';
    if (uptime >= 99) return 'bg-green-400';
    if (uptime >= 95) return 'bg-yellow-400';
    if (uptime >= 90) return 'bg-orange-400';
    return 'bg-red-500';
  };

  const getLabel = (uptime) => {
    if (uptime === null) return 'No data';
    if (uptime === 100) return 'Perfect';
    if (uptime >= 99) return 'Excellent';
    if (uptime >= 95) return 'Good';
    if (uptime >= 90) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          90-Day Uptime History
        </h2>

        {/* Service Filter */}
        {services && services.length > 0 && (
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Services (Combined)</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>100%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-400 rounded"></div>
          <span>99%+</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-400 rounded"></div>
          <span>95-99%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-400 rounded"></div>
          <span>90-95%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>&lt;90%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-200 rounded"></div>
          <span>No data</span>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="relative">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(12px,1fr))] gap-1">
          {days.map((day, index) => (
            <div
              key={index}
              className="relative"
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              <div
                className={`w-3 h-3 rounded cursor-pointer transition-transform hover:scale-150 ${getColor(day.uptime)}`}
                title={`${day.displayDate}: ${day.uptime !== null ? `${parseFloat(day.uptime).toFixed(2)}%` : 'No data'}`}
              ></div>
            </div>
          ))}
        </div>

        {/* Tooltip */}
        {hoveredDay && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap z-10">
            <div className="font-semibold">{hoveredDay.displayDate}</div>
            <div>
              Uptime: {hoveredDay.uptime !== null ? `${parseFloat(hoveredDay.uptime).toFixed(2)}%` : 'No data'}
            </div>
            <div className="text-gray-300">
              {getLabel(hoveredDay.uptime)}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Showing last 90 days • Hover over each day for details
      </div>
    </div>
  );
}
