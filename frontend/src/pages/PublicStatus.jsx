import { useState, useEffect } from 'react';
import { getOverallStatus, getUptimeStats, getRecentIncidents, getTimeline } from '../services/publicService';
import StatusHeader from '../components/public/StatusHeader';
import ServiceCard from '../components/public/ServiceCard';
import StatusTimeline from '../components/public/StatusTimeline';
import IncidentList from '../components/public/IncidentList';
import ServiceDetailsModal from '../components/public/ServiceDetailsModal';
import Loading from '../components/shared/Loading';
import Timestamp from '../components/shared/Timestamp';
import TimezoneToggle from '../components/shared/TimezoneToggle';
import { TimezoneProvider } from '../contexts/TimezoneContext';
import toast from 'react-hot-toast';

function PublicStatusContent() {
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState(null);
  const [uptimeStats, setUptimeStats] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [selectedService, setSelectedService] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load status data');
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                {statusData.settings.page_title || 'System Status'}
              </h1>
              <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                <span>Last updated: <Timestamp timestamp={lastUpdated} format="full" /></span>
                <span className="text-gray-300">|</span>
                <div className="flex items-center gap-2">
                  <span>Times in:</span>
                  <TimezoneToggle />
                </div>
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
        {/* Services Grid */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicesWithUptime.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>

          {servicesWithUptime.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">No services being monitored yet.</p>
            </div>
          )}
        </section>

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
          <p>Powered by Status Monitor</p>
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
