import express from 'express';
import {
  getOverallStatus,
  getServices,
  getAllServicesForAdmin,
  getUptimeStats,
  getRecentIncidents,
  getPrivateIncidents,
  getTimeline,
  getResponseTimes,
  getPingLogs,
  getAggregatedPingLogs,
  getDrillDownPingLogs,
} from '../controllers/publicController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All public routes - no authentication required

// Get overall system status
router.get('/status', getOverallStatus);

// Get list of all services (public only)
router.get('/services', getServices);

// Get list of all services including private ones (requires authentication)
router.get('/services/all', authenticateToken, getAllServicesForAdmin);

// Get uptime statistics
router.get('/uptime', getUptimeStats);

// Get recent incidents (public only)
router.get('/incidents', getRecentIncidents);

// Get recent incidents for private APIs (requires authentication)
router.get('/incidents/private', authenticateToken, getPrivateIncidents);

// Get 90-day timeline data
router.get('/timeline', getTimeline);

// Get response time data for charts
router.get('/response-times', getResponseTimes);

// Get ping logs for a specific API
router.get('/ping-logs/:apiId', getPingLogs);

// Get aggregated ping logs for longer periods (7d, 90d)
router.get('/ping-logs/:apiId/aggregated', getAggregatedPingLogs);

// Get drill-down ping logs for a specific time period
router.get('/ping-logs/:apiId/drill-down', getDrillDownPingLogs);

export default router;
