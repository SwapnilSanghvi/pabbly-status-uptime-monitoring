import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useTimezone } from '../../contexts/TimezoneContext';
import { formatTimestampWithTZ } from '../../utils/timezone';

export default function ServiceCard({ service, onViewDetails }) {
  const { isAuthenticated } = useAuth();
  const { timezone } = useTimezone();
  const status = service.last_status || service.current_status;
  const isOnline = status === 'success';
  const isPending = status === 'pending';

  const formatUptime = (uptime) => {
    if (uptime === null || uptime === undefined) return 'N/A';
    const uptimeNum = parseFloat(uptime);
    if (isNaN(uptimeNum)) return 'N/A';
    // Show whole number if 100%, otherwise show 1 decimal place for mobile compatibility
    return uptimeNum === 100 ? '100%' : `${uptimeNum.toFixed(1)}%`;
  };

  // Determine badge color and text
  const getBadgeStyles = () => {
    if (isPending) {
      return {
        bgColor: 'bg-yellow-100 text-yellow-800',
        dotColor: 'bg-yellow-500',
        text: 'Pending'
      };
    } else if (isOnline) {
      return {
        bgColor: 'bg-green-100 text-green-800',
        dotColor: 'bg-green-500',
        text: 'Up'
      };
    } else {
      return {
        bgColor: 'bg-red-100 text-red-800',
        dotColor: 'bg-red-500',
        text: 'Down'
      };
    }
  };

  const getCardGlow = () => {
    if (isPending) return 'hover:shadow-yellow-200/50';
    if (isOnline) return 'hover:shadow-green-200/50';
    return 'hover:shadow-red-200/50';
  };

  const badge = getBadgeStyles();

  return (
    <div className={`group relative bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-xl transition-all duration-300`} style={{ transform: 'translateY(0)' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
      {/* Header */}
      <div className="relative flex items-start justify-between gap-3 mb-5">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-gray-900 mb-1.5">
            {service.name}
          </h3>
          {isAuthenticated && (
            <p className="text-sm text-gray-500 truncate" title={service.url}>
              {service.url}
            </p>
          )}
        </div>
        <div className="flex-shrink-0">
          <span
            className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-md ${badge.bgColor}`}
          >
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full mr-2 flex-shrink-0 ${badge.dotColor} ${isOnline ? 'animate-pulse' : ''}`}
            ></span>
            {badge.text}
          </span>
        </div>
      </div>

      {/* Uptime Stats */}
      <div className="relative grid grid-cols-3 gap-4 mb-5">
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-3.5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">24 HRS</p>
          <p className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            {formatUptime(service.uptime_24h)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-3.5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">7 DAYS</p>
          <p className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            {formatUptime(service.uptime_7d)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-3.5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">30 DAYS</p>
          <p className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            {formatUptime(service.uptime_30d)}
          </p>
        </div>
      </div>

      {/* Response Time & Last Checked */}
      {(service.last_response_time || service.last_checked) && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3 -mx-1">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-xs font-medium text-gray-600">
                Response Time:{' '}
                {service.last_response_time && (
                  <span className="text-sm text-gray-900">
                    {service.last_response_time}ms
                  </span>
                )}
              </span>
            </div>
            {service.last_checked && (
              <div className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(service.last_checked), { addSuffix: true })}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Details Button */}
      <div className="mt-5 pt-4 border-t border-gray-200">
        <button
          onClick={() => onViewDetails && onViewDetails(service)}
          className="w-full flex items-center justify-center gap-2 text-sm text-blue-600 bg-white border-2 border-blue-600 hover:bg-blue-600 hover:text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 group"
        >
          <span>View Detailed History</span>
          <svg className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
