import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats, getAllAPIs } from '../services/adminService';
import QuickStats from '../components/admin/QuickStats';
import APITable from '../components/admin/APITable';
import AddAPIModal from '../components/admin/AddAPIModal';
import Loading from '../components/shared/Loading';
import { TimezoneProvider } from '../contexts/TimezoneContext';
import toast from 'react-hot-toast';

function AdminDashboardContent() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [apis, setApis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAPI, setEditingAPI] = useState(null);

  const fetchData = async () => {
    try {
      const [statsRes, apisRes] = await Promise.all([
        getDashboardStats(),
        getAllAPIs(),
      ]);

      setStats(statsRes.stats);
      setApis(apisRes.apis);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
    toast.success('Logged out successfully');
  };

  const handleAddClick = () => {
    setEditingAPI(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (api) => {
    setEditingAPI(api);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingAPI(null);
  };

  const handleSuccess = () => {
    fetchData();
  };

  const handleDelete = (apiId) => {
    setApis(apis.filter((api) => api.id !== apiId));
    // Refresh stats
    fetchData();
  };

  if (loading) {
    return <Loading message="Loading dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">
                Welcome back, {user?.email || 'Admin'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                View Public Page
              </a>
              <a
                href="/admin/settings"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                Settings
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        {stats && <QuickStats stats={stats} />}

        {/* APIs Management */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Monitored APIs</h2>
            <button
              onClick={handleAddClick}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add API
            </button>
          </div>

          <APITable
            apis={apis}
            onEdit={handleEditClick}
            onDelete={handleDelete}
            onAdd={handleAddClick}
          />
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>Status Monitor - Admin Panel</p>
          <p className="mt-2">Auto-refresh enabled (every 30 seconds)</p>
        </footer>
      </main>

      {/* Add/Edit Modal */}
      <AddAPIModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        editingAPI={editingAPI}
      />
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <TimezoneProvider>
      <AdminDashboardContent />
    </TimezoneProvider>
  );
}
