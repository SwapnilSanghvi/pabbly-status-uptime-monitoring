import { formatDistanceToNow } from 'date-fns';
import Timestamp from '../shared/Timestamp';

export default function IncidentList({ incidents }) {
  const getStatusBadge = (status) => {
    const configs = {
      resolved: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        dotColor: 'bg-green-500',
        label: 'Resolved',
      },
      ongoing: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        dotColor: 'bg-red-500',
        label: 'Ongoing',
      },
      identified: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        dotColor: 'bg-yellow-500',
        label: 'Identified',
      },
      monitoring: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        dotColor: 'bg-blue-500',
        label: 'Monitoring',
      },
    };

    const config = configs[status] || configs.ongoing;

    return (
      <span
        className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-sm ${config.bg} ${config.text}`}
      >
        <span className={`inline-block h-2 w-2 rounded-full mr-2 ${config.dotColor}`}></span>
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

    if (days > 0) {
      const remainingHours = hours % 24;
      return `${days} ${days === 1 ? 'day' : 'days'}${remainingHours > 0 ? ` ${remainingHours} ${remainingHours === 1 ? 'hour' : 'hours'}` : ''}`;
    }
    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}${remainingMinutes > 0 ? ` ${remainingMinutes} ${remainingMinutes === 1 ? 'minute' : 'minutes'}` : ''}`;
    }
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  };

  if (incidents.length === 0) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-md border border-green-200 p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">No Recent Incidents</h3>
        <p className="text-sm text-gray-600">All systems have been running smoothly</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {incidents.map((incident) => (
        <div
          key={incident.id}
          className="bg-white rounded-2xl border border-gray-200 p-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {incident.api_name ? `Affected service: ${incident.api_name}` : incident.title}
              </h3>
              {incident.description && (
                <p className="text-sm text-gray-600 leading-relaxed">
                  {incident.description}
                </p>
              )}
            </div>
            <div className="flex-shrink-0">{getStatusBadge(incident.status)}</div>
          </div>

          {/* Timeline */}
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-start gap-2">
                <svg className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Started</p>
                  <p className="text-sm text-gray-900 font-medium">
                    <Timestamp timestamp={incident.started_at} format="full" />
                  </p>
                </div>
              </div>

              {incident.resolved_at && (
                <div className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Resolved</p>
                    <p className="text-sm text-gray-900 font-medium">
                      <Timestamp timestamp={incident.resolved_at} format="full" />
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2">
                <svg className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Duration</p>
                  <p className="text-sm text-gray-900 font-medium">
                    {formatDuration(incident.started_at, incident.resolved_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
