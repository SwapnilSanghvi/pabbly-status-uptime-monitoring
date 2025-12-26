import Timestamp from '../shared/Timestamp';

export default function ServiceCard({ service, onViewDetails }) {
  const status = service.last_status || service.current_status;
  const isOnline = status === 'success';
  const isPending = status === 'pending';

  const formatUptime = (uptime) => {
    if (uptime === null || uptime === undefined) return 'N/A';
    const uptimeNum = parseFloat(uptime);
    if (isNaN(uptimeNum)) return 'N/A';
    return `${uptimeNum.toFixed(2)}%`;
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
        text: 'Operational'
      };
    } else {
      return {
        bgColor: 'bg-red-100 text-red-800',
        dotColor: 'bg-red-500',
        text: 'Down'
      };
    }
  };

  const badge = getBadgeStyles();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {service.name}
          </h3>
          <p className="text-sm text-gray-500 truncate" title={service.url}>
            {service.url}
          </p>
        </div>
        <div className="flex-shrink-0">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${badge.bgColor}`}
          >
            <span
              className={`h-2 w-2 rounded-full mr-1.5 ${badge.dotColor}`}
            ></span>
            {badge.text}
          </span>
        </div>
      </div>

      {/* Uptime Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">24 hours</p>
          <p className="text-sm font-semibold text-gray-900">
            {formatUptime(service.uptime_24h)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">7 days</p>
          <p className="text-sm font-semibold text-gray-900">
            {formatUptime(service.uptime_7d)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">30 days</p>
          <p className="text-sm font-semibold text-gray-900">
            {formatUptime(service.uptime_30d)}
          </p>
        </div>
      </div>

      {/* Response Time */}
      {service.last_response_time && (
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Response Time</span>
            <span className="text-sm font-medium text-gray-900">
              {service.last_response_time}ms
            </span>
          </div>
        </div>
      )}

      {/* Last Checked */}
      {service.last_checked && (
        <div className="mt-2">
          <p className="text-xs text-gray-400">
            Last checked: <Timestamp timestamp={service.last_checked} format="hybrid" />
          </p>
        </div>
      )}

      {/* View Details Button */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <button
          onClick={() => onViewDetails && onViewDetails(service)}
          className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View Detailed History →
        </button>
      </div>
    </div>
  );
}
