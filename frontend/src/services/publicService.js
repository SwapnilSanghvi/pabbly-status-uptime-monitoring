import api from './api';

// Get overall system status
export const getOverallStatus = async () => {
  const response = await api.get('/public/status');
  return response.data;
};

// Get all monitored services
export const getServices = async () => {
  const response = await api.get('/public/services');
  return response.data;
};

// Get uptime statistics
export const getUptimeStats = async () => {
  const response = await api.get('/public/uptime');
  return response.data;
};

// Get recent incidents
export const getRecentIncidents = async (limit = 10) => {
  const response = await api.get(`/public/incidents?limit=${limit}`);
  return response.data;
};

// Get timeline data
export const getTimeline = async () => {
  const response = await api.get('/public/timeline');
  return response.data;
};

// Get response times
export const getResponseTimes = async (apiId = null, period = '24h') => {
  const params = new URLSearchParams();
  if (apiId) params.append('apiId', apiId);
  params.append('period', period);

  const response = await api.get(`/public/response-times?${params.toString()}`);
  return response.data;
};

export default {
  getOverallStatus,
  getServices,
  getUptimeStats,
  getRecentIncidents,
  getTimeline,
  getResponseTimes,
};
