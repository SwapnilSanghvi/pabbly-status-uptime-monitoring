import { useState, useEffect } from 'react';
import { getOverallStatus, getUptimeStats, getRecentIncidents, getTimeline, getAllServicesForAdmin } from '../services/publicService';
import StatusHeader from '../components/public/StatusHeader';
import ServiceCard from '../components/public/ServiceCard';
import StatusTimeline from '../components/public/StatusTimeline';
import IncidentList from '../components/public/IncidentList';
import ServiceDetailsModal from '../components/public/ServiceDetailsModal';
import Loading from '../components/shared/Loading';
import Timestamp from '../components/shared/Timestamp';
import TimezoneToggle from '../components/shared/TimezoneToggle';
import { TimezoneProvider } from '../contexts/TimezoneContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function PublicStatusContent() {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState(null);
  const [uptimeStats, setUptimeStats] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [selectedService, setSelectedService] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [privateServices, setPrivateServices] = useState([]);

  // Fetch all data
  const fetchData = async () => {
    try {
      const [statusRes, uptimeRes, incidentsRes, timelineRes] = await Promise.all([
        getOverallStatus(),
        getUptimeStats(),
        getRecentIncidents(5),
        getTimeline(),
      ]);

      setStatusData(statusRes);
      setUptimeStats(uptimeRes.uptime_stats || []);
      setIncidents(incidentsRes.incidents || []);
      setTimeline(timelineRes.timeline || []);
      setLastUpdated(new Date());

      // If user is authenticated, fetch private services
      if (isAuthenticated) {
        try {
          const allServicesRes = await getAllServicesForAdmin();
          setPrivateServices(allServicesRes.privateServices || []);
        } catch (error) {
          console.error('Error fetching private services:', error);
          // Don't show error to user, just don't show private services
        }
      } else {
        setPrivateServices([]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load status data');
      setLoading(false);
    }
  };

  // Initial load and re-fetch when authentication changes
  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleViewDetails = (service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedService(null);
  };

  if (loading) {
    return <Loading message="Loading status..." />;
  }

  if (!statusData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Unable to load status data</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Merge uptime stats with services
  const servicesWithUptime = statusData.services.map((service) => {
    const stats = uptimeStats.find((s) => s.id === service.id) || {};
    return {
      ...service,
      uptime_24h: stats.uptime_24h,
      uptime_7d: stats.uptime_7d,
      uptime_30d: stats.uptime_30d,
    };
  });

  // Merge uptime stats with private services
  const privateServicesWithUptime = privateServices.map((service) => {
    const stats = uptimeStats.find((s) => s.id === service.id) || {};
    return {
      ...service,
      uptime_24h: stats.uptime_24h,
      uptime_7d: stats.uptime_7d,
      uptime_30d: stats.uptime_30d,
    };
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div>
              {/* Logo and Title */}
              {statusData.settings.logo_url && (
                <img
                  src={`${import.meta.env.VITE_API_URL.replace('/api', '')}${statusData.settings.logo_url}`}
                  alt="Logo"
                  className="h-8 sm:h-10 w-auto object-contain mb-2"
                />
              )}
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                {statusData.settings.page_title || 'System Status'}
              </h1>
            </div>

            {/* Right Side: Admin Link (if logged in), Timestamp and Timezone */}
            <div className="flex flex-col sm:items-end gap-2 text-xs sm:text-sm text-gray-600">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 hidden sm:inline">Last updated:</span>
                  <span className="text-gray-500 sm:hidden">Updated:</span>
                  <Timestamp timestamp={lastUpdated} format="full" />
                </div>
                {isAuthenticated && (
                  <a
                    href="/admin/dashboard"
                    className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="hidden sm:inline">Admin</span>
                  </a>
                )}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-gray-500 hidden sm:inline">Times in:</span>
                <TimezoneToggle />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Status Banner */}
      <StatusHeader
        overallStatus={statusData.overall_status}
        totalServices={statusData.total_services}
        servicesDown={statusData.services_down}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Public Services Grid */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Public Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicesWithUptime.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>

          {servicesWithUptime.length === 0 && !isAuthenticated && (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">No services being monitored yet.</p>
            </div>
          )}
        </section>

        {/* Private Services Grid (only for authenticated admins) */}
        {isAuthenticated && privateServicesWithUptime.length > 0 && (
          <>
            <div className="mb-12">
              <hr className="border-t border-dotted border-gray-300" />
            </div>

            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Private Services</h2>
                <span className="px-3 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                  Admin Only
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {privateServicesWithUptime.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {/* Separator */}
        {incidents.length > 0 && (
          <div className="mb-12">
            <hr className="border-t border-dotted border-gray-300" />
          </div>
        )}

        {/* Recent Incidents */}
        {incidents.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Recent Incidents
            </h2>
            <IncidentList incidents={incidents} />
          </section>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          {statusData.settings.logo_url && (
            <img
              src={`${import.meta.env.VITE_API_URL.replace('/api', '')}${statusData.settings.logo_url}`}
              alt="Logo"
              className="h-8 w-auto object-contain mx-auto mb-3"
            />
          )}
          <p>Powered by Pabbly Status Monitor</p>
          <p className="mt-2">
            Auto-refresh enabled (every 30 seconds)
          </p>
        </footer>
      </main>

      {/* Service Details Modal */}
      <ServiceDetailsModal
        service={selectedService}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}

export default function PublicStatus() {
  return (
    <TimezoneProvider>
      <PublicStatusContent />
    </TimezoneProvider>
  );
}
