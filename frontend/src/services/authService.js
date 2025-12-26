import api from './api';

// Login
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });

  if (response.data.success && response.data.token) {
    localStorage.setItem('token', response.data.token);
    // Backend returns 'admin' field, not 'user'
    const userData = response.data.admin || response.data.user;
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
  }

  return response.data;
};

// Logout
export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// Verify token
export const verifyToken = async () => {
  const response = await api.get('/auth/verify');
  return response.data;
};

// Get profile
export const getProfile = async () => {
  const response = await api.get('/auth/profile');
  return response.data;
};

// Update profile
export const updateProfile = async (data) => {
  const response = await api.put('/auth/profile', data);
  return response.data;
};

// Change password
export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.put('/auth/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return response.data;
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// Get current user from localStorage
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr || userStr === 'undefined' || userStr === 'null') {
      return null;
    }
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    return null;
  }
};

export default {
  login,
  logout,
  verifyToken,
  getProfile,
  updateProfile,
  changePassword,
  isAuthenticated,
  getCurrentUser,
};
