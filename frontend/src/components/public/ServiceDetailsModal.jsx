import { useState, useEffect, useRef } from 'react';
import { useTimezone } from '../../contexts/TimezoneContext';
import { formatTimestampWithTZ, formatFullTimestamp } from '../../utils/timezone';

export default function ServiceDetailsModal({ service, isOpen, onClose }) {
  const { timezone } = useTimezone();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('24h'); // 24h, 7d, 90d
  const [errorDetailsModal, setErrorDetailsModal] = useState(null);
  const [tooltipData, setTooltipData] = useState(null);
  const [drillDownDate, setDrillDownDate] = useState(null);
  const [drillDownTooltip, setDrillDownTooltip] = useState(null);

  useEffect(() => {
    if (isOpen && service) {
      fetchPingLogs();
    }
  }, [isOpen, service, timeRange]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const fetchPingLogs = async () => {
    setLoading(true);
    try {
      const isAggregated = ['7d', '90d'].includes(timeRange);

      if (isAggregated) {
        // Fetch aggregated data for longer periods
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/public/ping-logs/${service.id}/aggregated?period=${timeRange}`
        );
        const data = await response.json();

        // Transform aggregated buckets into log-like format for rendering
        const transformedLogs = (data.buckets || []).map(bucket => ({
          time_bucket: bucket.time_bucket,
          bucket_start: bucket.bucket_start,
          bucket_end: bucket.bucket_end,
          status: bucket.failed_pings > 0 ? 'failure' : 'success',
          total_pings: bucket.total_pings,
          successful_pings: bucket.successful_pings,
          failed_pings: bucket.failed_pings,
          uptime_percentage: bucket.uptime_percentage,
          avg_response_time: Math.round(bucket.avg_response_time || 0),
          is_aggregated: true
        }));

        setLogs(transformedLogs);
      } else {
        // Fetch individual pings for 24h (1440 pings)
        const limit = 1440;

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/public/ping-logs/${service.id}?limit=${limit}`
        );
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching ping logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Calculate statistics differently for aggregated vs raw data
  const successCount = logs.filter(log => {
    if (log.is_aggregated) {
      return log.failed_pings === 0;
    }
    return log.status === 'success';
  }).length;

  const failureCount = logs.length - successCount;
  const uptimePercent = logs.length > 0 ? ((successCount / logs.length) * 100).toFixed(2) : 0;

  // For aggregated data, use weighted average response time
  const avgResponseTime = logs.length > 0
    ? logs[0]?.is_aggregated
      ? Math.round(logs.reduce((sum, log) => sum + (log.avg_response_time * log.total_pings), 0) /
                    logs.reduce((sum, log) => sum + log.total_pings, 0))
      : Math.round(logs.reduce((sum, log) => sum + (log.response_time || 0), 0) / logs.length)
    : 0;

  const handleShowErrorDetails = (log) => {
    setErrorDetailsModal(log);
  };

  const handleDrillDown = async (log) => {
    if (!log.is_aggregated) return;

    // Clear tooltip when opening drill-down modal
    setTooltipData(null);

    setLoading(true);
    try {
      // For 90d view, drill down to 24h of that specific day
      // For 7d view, drill down to 1h of that specific hour
      const startTime = new Date(log.bucket_start);
      const endTime = new Date(log.bucket_end);

      // Fetch individual pings for this time period
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/public/ping-logs/${service.id}/drill-down?start=${startTime.toISOString()}&end=${endTime.toISOString()}`
      );
      const data = await response.json();

      setDrillDownDate({
        period: log,
        logs: data.logs || [],
        timeRange: timeRange
      });
    } catch (error) {
      console.error('Error fetching drill-down data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        ></div>

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900">{service.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{service.url}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-gray-50 border-b flex-shrink-0">
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Uptime ({timeRange})</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{uptimePercent}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Pings</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{logs.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Successful</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">{successCount}</p>
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Failed</p>
              <p className="text-xl sm:text-2xl font-bold text-red-600">{failureCount}</p>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="p-4 border-b flex-shrink-0">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Ping History</h4>
            <div className="flex gap-2 flex-wrap">
              {['24h', '7d', '90d'].map((range) => {
                const labels = {
                  '24h': 'Last 24 Hours',
                  '7d': 'Last 7 Days',
                  '90d': 'Last 90 Days'
                };
                return (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                      timeRange === range
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {labels[range]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visual Timeline */}
          <div className="p-6 overflow-y-auto flex-1">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 mt-2">Loading ping logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No ping data available</p>
              </div>
            ) : (
              <div>
                {/* Legend */}
                <div className="flex items-center justify-center gap-6 mb-6 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Success</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span>Failed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-200 rounded"></div>
                    <span>No data</span>
                  </div>
                </div>

                {/* Timeline Grid */}
                <div className="relative pb-20">
                  <div className="overflow-x-auto">
                    <div className="inline-flex gap-0.5 flex-wrap" style={{ maxWidth: '100%' }}>
                      {(logs[0]?.is_aggregated ? logs : logs.slice().reverse()).map((log, index) => {
                        const handleMouseEnter = (e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltipData({
                            log,
                            x: rect.left + rect.width / 2,
                            y: rect.top,
                            bottomY: rect.bottom,
                          });
                        };

                        return (
                          <div
                            key={index}
                            className="relative group"
                            onClick={() => {
                              if (log.is_aggregated) {
                                handleDrillDown(log);
                              } else if (log.status !== 'success') {
                                handleShowErrorDetails(log);
                              }
                            }}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={() => setTooltipData(null)}
                          >
                            <div
                              className={`w-1 h-8 rounded-sm ${(log.is_aggregated || (!log.is_aggregated && log.status !== 'success')) ? 'cursor-pointer' : 'cursor-default'} transition-opacity hover:opacity-80 ${
                                log.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                              }`}
                            ></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Smart Tooltip */}
                {tooltipData && (
                  <div
                    className="fixed px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap pointer-events-none z-[9999]"
                    style={{
                      left: `${Math.min(Math.max(10, tooltipData.x - 100), window.innerWidth - 210)}px`,
                      top: tooltipData.y > window.innerHeight / 2
                        ? `${tooltipData.y - 10}px`
                        : `${tooltipData.bottomY + 10}px`,
                      transform: tooltipData.y > window.innerHeight / 2
                        ? 'translateY(-100%)'
                        : 'none',
                    }}
                  >
                    {tooltipData.log.is_aggregated ? (
                      <>
                        <div className="font-semibold">
                          {formatTimestampWithTZ(tooltipData.log.bucket_start, { showRelative: false, showExact: true, showTimezone: false, timezone })}
                          {' to '}
                          {formatTimestampWithTZ(tooltipData.log.bucket_end, { showRelative: false, showExact: true, showTimezone: true, timezone })}
                        </div>
                        <div>Uptime: {tooltipData.log.uptime_percentage}%</div>
                        <div>Total Pings: {tooltipData.log.total_pings}</div>
                        <div>Successful: {tooltipData.log.successful_pings}</div>
                        <div>Failed: {tooltipData.log.failed_pings}</div>
                        <div>Avg Response: {tooltipData.log.avg_response_time}ms</div>
                        <div className="text-blue-300 mt-2 text-xs">
                          Click to view detailed breakdown →
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-semibold">
                          {formatTimestampWithTZ(tooltipData.log.pinged_at, { showRelative: false, showExact: true, showTimezone: true, timezone })}
                        </div>
                        <div>Status: {tooltipData.log.status === 'success' ? 'Success' : 'Failed'}</div>
                        <div>Response: {tooltipData.log.response_time || 0}ms</div>
                        {tooltipData.log.status_code && <div>Code: {tooltipData.log.status_code}</div>}
                        {tooltipData.log.error_message && (
                          <div className="text-red-300 mt-1 max-w-xs truncate">
                            Error: {tooltipData.log.error_message}
                          </div>
                        )}
                        {tooltipData.log.status !== 'success' && (
                          <div className="text-blue-300 mt-2 text-xs">
                            Click to view full response details →
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                <div className="mt-4 text-xs text-gray-500 text-center">
                  {logs[0]?.is_aggregated
                    ? `Each bar represents ${timeRange === '7d' ? '1 hour' : '1 day'} • Hover for details • ${logs.length} time periods shown`
                    : `Each bar represents 1 ping • Hover for details • ${logs.length} total pings shown`
                  }
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-4 border-t bg-gray-50 flex-shrink-0">
            <p className="text-xs text-gray-500 hidden sm:block">
              Showing minute-level ping data • Updates every minute
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 ml-auto"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Error Details Modal */}
      {errorDetailsModal && (
        <div className="fixed inset-0 z-[70] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setErrorDetailsModal(null)}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Error Response Details
                </h3>
                <button
                  onClick={() => setErrorDetailsModal(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                {/* Timestamp */}
                <div className="mb-4">
                  <span className="text-sm font-medium text-gray-700">Time:</span>{' '}
                  <span className="text-sm text-gray-900">
                    {formatTimestampWithTZ(errorDetailsModal.pinged_at, { showRelative: false, showExact: true, showTimezone: true, timezone })}
                  </span>
                </div>

                {/* Status Code */}
                <div className="mb-4">
                  <span className="text-sm font-medium text-gray-700">Status Code:</span>{' '}
                  <span className="text-red-600 font-mono font-semibold">
                    {errorDetailsModal.status_code || 'N/A'}
                  </span>
                </div>

                {/* Error Message */}
                {errorDetailsModal.error_message && (
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-700">Error:</span>{' '}
                    <span className="text-red-600">{errorDetailsModal.error_message}</span>
                  </div>
                )}

                {/* Response Headers */}
                {errorDetailsModal.response_headers && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Response Headers:</h4>
                    <pre className="bg-gray-50 p-4 rounded border border-gray-200 overflow-x-auto text-xs font-mono">
                      {JSON.stringify(errorDetailsModal.response_headers, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Response Body */}
                {errorDetailsModal.response_body && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Response Body:</h4>
                    <pre className="bg-gray-50 p-4 rounded border border-gray-200 overflow-x-auto text-xs font-mono max-h-96 whitespace-pre-wrap break-words">
                      {errorDetailsModal.response_body}
                    </pre>
                  </div>
                )}

                {/* No response data message */}
                {!errorDetailsModal.response_body && !errorDetailsModal.response_headers && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No response data captured for this error.</p>
                    <p className="text-xs mt-2">This may be a network timeout or connection failure.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setErrorDetailsModal(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drill-Down Modal */}
      {drillDownDate && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setDrillDownDate(null)}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Detailed Breakdown
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatTimestampWithTZ(drillDownDate.period.bucket_start, { showRelative: false, showExact: true, showTimezone: false, timezone })}
                    {' to '}
                    {formatTimestampWithTZ(drillDownDate.period.bucket_end, { showRelative: false, showExact: true, showTimezone: true, timezone })}
                  </p>
                </div>
                <button
                  onClick={() => setDrillDownDate(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {drillDownDate.logs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No ping data available for this period</p>
                  </div>
                ) : (
                  <>
                    {/* Stats Summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Total Pings</p>
                        <p className="text-lg sm:text-xl font-bold text-gray-900">{drillDownDate.logs.length}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Successful</p>
                        <p className="text-lg sm:text-xl font-bold text-green-600">
                          {drillDownDate.logs.filter(l => l.status === 'success').length}
                        </p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Failed</p>
                        <p className="text-lg sm:text-xl font-bold text-red-600">
                          {drillDownDate.logs.filter(l => l.status !== 'success').length}
                        </p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Avg Response</p>
                        <p className="text-lg sm:text-xl font-bold text-blue-600">
                          {Math.round(drillDownDate.logs.reduce((sum, l) => sum + (l.response_time || 0), 0) / drillDownDate.logs.length)}ms
                        </p>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Minute-by-Minute Timeline</h4>
                      <div className="overflow-x-auto relative">
                        <div className="inline-flex gap-0.5 flex-wrap" style={{ maxWidth: '100%' }}>
                          {drillDownDate.logs.map((log, index) => {
                            const handleMouseEnter = (e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setDrillDownTooltip({
                                log,
                                x: rect.left + rect.width / 2,
                                y: rect.top,
                                bottomY: rect.bottom,
                              });
                            };

                            return (
                              <div
                                key={index}
                                className="relative group"
                                onClick={() => log.status !== 'success' && handleShowErrorDetails(log)}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={() => setDrillDownTooltip(null)}
                              >
                                <div
                                  className={`w-1 h-8 rounded-sm ${log.status !== 'success' ? 'cursor-pointer' : 'cursor-default'} transition-opacity hover:opacity-80 ${
                                    log.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                                  }`}
                                ></div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Drill-down Tooltip */}
                        {drillDownTooltip && (
                          <div
                            className="fixed px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap pointer-events-none z-[9999]"
                            style={{
                              left: `${Math.min(Math.max(10, drillDownTooltip.x - 100), window.innerWidth - 210)}px`,
                              top: drillDownTooltip.y > window.innerHeight / 2
                                ? `${drillDownTooltip.y - 10}px`
                                : `${drillDownTooltip.bottomY + 10}px`,
                              transform: drillDownTooltip.y > window.innerHeight / 2
                                ? 'translateY(-100%)'
                                : 'none',
                            }}
                          >
                            <div className="font-semibold">
                              {formatTimestampWithTZ(drillDownTooltip.log.pinged_at, { showRelative: false, showExact: true, showTimezone: true, timezone })}
                            </div>
                            <div>Status: {drillDownTooltip.log.status === 'success' ? 'Success' : 'Failed'}</div>
                            <div>Response: {drillDownTooltip.log.response_time || 0}ms</div>
                            {drillDownTooltip.log.status_code && <div>Code: {drillDownTooltip.log.status_code}</div>}
                            {drillDownTooltip.log.error_message && (
                              <div className="text-red-300 mt-1 max-w-xs truncate">
                                Error: {drillDownTooltip.log.error_message}
                              </div>
                            )}
                            {drillDownTooltip.log.status !== 'success' && (
                              <div className="text-blue-300 mt-2 text-xs">
                                Click to view full response details →
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="mt-3 text-xs text-gray-500 text-center">
                        Each bar represents 1 ping • {drillDownDate.logs.length} total pings shown • Hover for details • Click red bars for error details
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setDrillDownDate(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
