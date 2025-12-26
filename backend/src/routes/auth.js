import express from 'express';
import {
  login,
  logout,
  verifyToken,
  getProfile,
  updateProfile,
  changePassword,
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/login', login);
router.post('/logout', logout);

// Protected routes (authentication required)
router.get('/verify', authenticateToken, verifyToken);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.put('/change-password', authenticateToken, changePassword);

export default router;
