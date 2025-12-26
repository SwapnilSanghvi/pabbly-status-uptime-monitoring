import { formatDistanceToNow } from 'date-fns';
import Timestamp from '../shared/Timestamp';

export default function IncidentList({ incidents }) {
  const getStatusBadge = (status) => {
    const configs = {
      resolved: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        label: 'Resolved',
        icon: '✓',
      },
      ongoing: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        label: 'Ongoing',
        icon: '!',
      },
      identified: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        label: 'Identified',
        icon: '⚠',
      },
      monitoring: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        label: 'Monitoring',
        icon: '👁',
      },
    };

    const config = configs[status] || configs.ongoing;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const formatDuration = (startedAt, resolvedAt) => {
    if (!resolvedAt) {
      return `${formatDistanceToNow(new Date(startedAt))} (ongoing)`;
    }

    const start = new Date(startedAt);
    const end = new Date(resolvedAt);
    const durationMs = end - start;
    const minutes = Math.round(durationMs / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  if (incidents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-green-600 mb-2">
          <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-600 font-medium">No recent incidents</p>
        <p className="text-sm text-gray-500 mt-1">All systems have been running smoothly</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {incidents.map((incident) => (
        <div
          key={incident.id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {incident.title}
              </h3>
              {incident.api_name && (
                <p className="text-sm text-gray-600">
                  Affected service: <span className="font-medium">{incident.api_name}</span>
                </p>
              )}
            </div>
            <div className="ml-4">{getStatusBadge(incident.status)}</div>
          </div>

          {/* Description */}
          {incident.description && (
            <p className="text-sm text-gray-700 mb-3">{incident.description}</p>
          )}

          {/* Timeline */}
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <div>
              <span className="font-medium">Started:</span>{' '}
              <Timestamp timestamp={incident.started_at} format="full" />
            </div>
            {incident.resolved_at && (
              <div>
                <span className="font-medium">Resolved:</span>{' '}
                <Timestamp timestamp={incident.resolved_at} format="full" />
              </div>
            )}
            <div>
              <span className="font-medium">Duration:</span>{' '}
              {formatDuration(incident.started_at, incident.resolved_at)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
