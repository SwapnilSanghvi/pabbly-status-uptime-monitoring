import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile, changePassword, getCurrentUser } from '../services/authService';
import { getSettings, updateSettings, uploadLogo } from '../services/adminService';
import Loading from '../components/shared/Loading';
import toast from 'react-hot-toast';

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Account Settings
  const [profileData, setProfileData] = useState({
    email: '',
    full_name: '',
  });

  // Password Change
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // System Settings
  const [systemSettings, setSystemSettings] = useState({
    page_title: '',
    brand_color: '',
    custom_message: '',
    notification_email: '',
    notifications_enabled: false,
    webhook_url: '',
    webhook_enabled: false,
    logo_url: '',
  });

  // Logo Upload
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Try to get user from localStorage first as fallback
      const currentUser = getCurrentUser();

      // Fetch profile and settings
      const promises = [];

      // Only fetch profile if we don't have user data in localStorage
      if (currentUser) {
        // Use localStorage data directly
        setProfileData({
          email: currentUser.email || '',
          full_name: currentUser.full_name || '',
        });
        promises.push(getSettings());
      } else {
        // Fetch both
        promises.push(getProfile(), getSettings());
      }

      const results = await Promise.all(promises);

      // Handle profile data if we fetched it
      if (!currentUser && results.length === 2) {
        const profileRes = results[0];
        if (profileRes && profileRes.admin) {
          setProfileData({
            email: profileRes.admin.email || '',
            full_name: profileRes.admin.full_name || '',
          });
        }
      }

      // Handle settings data
      const settingsRes = currentUser ? results[0] : results[1];
      if (settingsRes && settingsRes.settings) {
        setSystemSettings({
          page_title: settingsRes.settings.page_title || '',
          brand_color: settingsRes.settings.brand_color || '#3b82f6',
          custom_message: settingsRes.settings.custom_message || '',
          notification_email: settingsRes.settings.notification_email || '',
          notifications_enabled: settingsRes.settings.notifications_enabled || false,
          webhook_url: settingsRes.settings.webhook_url || '',
          webhook_enabled: settingsRes.settings.webhook_enabled || false,
          logo_url: settingsRes.settings.logo_url || '',
        });

        // Set logo preview if logo exists
        if (settingsRes.settings.logo_url) {
          const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
          const baseUrl = apiBaseUrl.replace('/api', '');
          setLogoPreview(baseUrl + settingsRes.settings.logo_url);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSystemChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSystemSettings({
      ...systemSettings,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateProfile(profileData);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSaving(true);

    try {
      await changePassword(passwordData.current_password, passwordData.new_password);
      toast.success('Password changed successfully');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error) {
      console.error('Password change error:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleSystemSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateSettings(systemSettings);
      toast.success('System settings updated successfully');
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a PNG, JPG, JPEG, or SVG file');
        return;
      }

      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB');
        return;
      }

      setLogoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) {
      toast.error('Please select a logo file first');
      return;
    }

    setUploadingLogo(true);

    try {
      const result = await uploadLogo(logoFile);
      toast.success('Logo uploaded successfully');

      // Update system settings with new logo URL
      setSystemSettings({
        ...systemSettings,
        logo_url: result.logo_url,
      });

      // Clear the file input
      setLogoFile(null);

      // Refresh settings to get updated data
      await fetchData();
    } catch (error) {
      console.error('Logo upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoRemove = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
    toast.success('Logged out successfully');
  };

  if (loading) {
    return <Loading message="Loading settings..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage your account and system settings
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/admin/dashboard"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                Back to Dashboard
              </a>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Account Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Account Settings
            </h2>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={profileData.full_name}
                  onChange={handleProfileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Change Password
            </h2>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  id="current_password"
                  name="current_password"
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  id="new_password"
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirm_password"
                  name="confirm_password"
                  value={passwordData.confirm_password}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {saving ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>

          {/* System Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              System Settings
            </h2>
            <form onSubmit={handleSystemSubmit} className="space-y-4">
              {/* Logo Upload Section */}
              <div className="border-b border-gray-200 pb-4 mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Logo
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Upload your custom logo (PNG, JPG, JPEG, or SVG, max 2MB)
                </p>

                {logoPreview && (
                  <div className="mb-3">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="h-16 w-auto max-w-xs object-contain border border-gray-200 rounded p-2 bg-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleLogoRemove}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="logo"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                    onChange={handleLogoChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-medium
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                  {logoFile && (
                    <button
                      type="button"
                      onClick={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 whitespace-nowrap"
                    >
                      {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="page_title" className="block text-sm font-medium text-gray-700 mb-1">
                  Status Page Title
                </label>
                <input
                  type="text"
                  id="page_title"
                  name="page_title"
                  value={systemSettings.page_title}
                  onChange={handleSystemChange}
                  placeholder="System Status"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="brand_color" className="block text-sm font-medium text-gray-700 mb-1">
                  Brand Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="brand_color"
                    name="brand_color"
                    value={systemSettings.brand_color}
                    onChange={handleSystemChange}
                    className="h-10 w-20 border border-gray-300 rounded-md cursor-pointer"
                  />
                  <input
                    type="text"
                    value={systemSettings.brand_color}
                    onChange={handleSystemChange}
                    name="brand_color"
                    placeholder="#3b82f6"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="custom_message" className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Message (Optional)
                </label>
                <textarea
                  id="custom_message"
                  name="custom_message"
                  rows="3"
                  value={systemSettings.custom_message}
                  onChange={handleSystemChange}
                  placeholder="Display a custom message on the public status page"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="notification_email" className="block text-sm font-medium text-gray-700 mb-1">
                  Notification Email
                </label>
                <input
                  type="email"
                  id="notification_email"
                  name="notification_email"
                  value={systemSettings.notification_email}
                  onChange={handleSystemChange}
                  placeholder="alerts@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notifications_enabled"
                  name="notifications_enabled"
                  checked={systemSettings.notifications_enabled}
                  onChange={handleSystemChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="notifications_enabled" className="ml-2 block text-sm text-gray-900">
                  Enable email notifications for downtime alerts
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Update Settings'}
                </button>
              </div>
            </form>
          </div>

          {/* Webhook Configuration */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Webhook Configuration
            </h2>
            <form onSubmit={handleSystemSubmit} className="space-y-4">
              <div>
                <label htmlFor="webhook_url" className="block text-sm font-medium text-gray-700 mb-1">
                  Webhook URL
                </label>
                <input
                  type="url"
                  id="webhook_url"
                  name="webhook_url"
                  value={systemSettings.webhook_url}
                  onChange={handleSystemChange}
                  placeholder="https://your-webhook-endpoint.com/webhook"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Webhook notifications will be sent to this URL when APIs go down or come back up
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="webhook_enabled"
                  name="webhook_enabled"
                  checked={systemSettings.webhook_enabled}
                  onChange={handleSystemChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="webhook_enabled" className="ml-2 block text-sm text-gray-900">
                  Enable webhook notifications
                </label>
              </div>

              {/* Webhook Payload Documentation */}
              <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Webhook Payload Structure</h3>
                <p className="text-xs text-gray-600 mb-3">
                  When an API status changes, a POST request with this JSON payload will be sent:
                </p>
                <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
{`{
  "event_type": "api_down" | "api_up",
  "status": "down" | "up",
  "timestamp": "2025-12-26T10:30:00.000Z",
  "api": {
    "id": 1,
    "name": "API Name",
    "url": "https://api.example.com",
    "monitoring_interval": 60,
    "expected_status_code": 200
  },
  "incident": {
    "id": 42,
    "title": "API is down",
    "description": "Incident details...",
    "status": "ongoing" | "resolved",
    "started_at": "2025-12-26T10:30:00.000Z",
    "resolved_at": "2025-12-26T10:35:00.000Z",
    "downtime_minutes": 5
  }
}`}
                </pre>
                <p className="text-xs text-gray-600 mt-2">
                  <strong>Note:</strong> The payload structure is identical for both DOWN and UP events. Only the <code className="bg-gray-200 px-1 rounded">status</code> field changes.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Update Webhook Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
