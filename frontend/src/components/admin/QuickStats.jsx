export default function QuickStats({ stats }) {
  const statCards = [
    {
      label: 'Total APIs',
      value: stats.total_apis || 0,
      icon: '📊',
      color: 'blue',
    },
    {
      label: 'Currently Down',
      value: stats.apis_down || 0,
      icon: '⚠️',
      color: stats.apis_down > 0 ? 'red' : 'green',
    },
    {
      label: 'Average Uptime',
      value: stats.avg_uptime ? `${parseFloat(stats.avg_uptime).toFixed(2)}%` : 'N/A',
      icon: '📈',
      color: 'green',
    },
    {
      label: 'Pings Today',
      value: stats.total_pings_today || 0,
      icon: '🔔',
      color: 'purple',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
                {stat.label}
              </p>
              <p className="text-xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <div
              className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-base sm:text-2xl flex-shrink-0 ml-2 ${
                colorClasses[stat.color]
              }`}
            >
              {stat.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
