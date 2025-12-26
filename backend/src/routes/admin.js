import express from 'express';
import {
  getAllAPIs,
  getAPIById,
  createAPI,
  updateAPI,
  deleteAPI,
  reorderAPIs,
  getDashboardStats,
  getPingLogs,
  getAPIAnalytics,
  getIncidents,
  createIncident,
  updateIncident,
  deleteIncident,
  getSettings,
  updateSettings,
  getWebhookLogs,
  testWebhookEndpoint,
} from '../controllers/adminController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication
router.use(authenticateToken);

// API Management
router.get('/apis', getAllAPIs);
router.get('/apis/:id', getAPIById);
router.post('/apis', createAPI);
router.put('/apis/:id', updateAPI);
router.delete('/apis/:id', deleteAPI);
router.put('/apis-reorder', reorderAPIs);

// Dashboard Stats
router.get('/dashboard-stats', getDashboardStats);

// Logs & Analytics
router.get('/logs/:apiId', getPingLogs);
router.get('/analytics/:apiId', getAPIAnalytics);

// Incidents
router.get('/incidents', getIncidents);
router.post('/incidents', createIncident);
router.put('/incidents/:id', updateIncident);
router.delete('/incidents/:id', deleteIncident);

// Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// Webhooks
router.get('/webhook-logs', getWebhookLogs);
router.post('/webhook-test', testWebhookEndpoint);

export default router;
