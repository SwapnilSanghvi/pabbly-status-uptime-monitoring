export default function StatusHeader({ overallStatus, totalServices, servicesDown }) {
  const getStatusConfig = () => {
    if (servicesDown === 0) {
      return {
        text: 'All Systems Operational',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800',
        iconColor: 'text-green-600',
      };
    } else if (servicesDown < totalServices / 2) {
      return {
        text: 'Partial System Outage',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
        iconColor: 'text-yellow-600',
      };
    } else {
      return {
        text: 'Major System Outage',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        iconColor: 'text-red-600',
      };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`${config.bgColor} border-t border-b ${config.borderColor}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <div className={`h-4 w-4 rounded-full ${config.iconColor} mr-3`}>
                <div className={`h-full w-full rounded-full ${servicesDown === 0 ? 'bg-green-500' : servicesDown < totalServices / 2 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
              </div>
              <h2 className={`text-2xl font-bold ${config.textColor}`}>
                {config.text}
              </h2>
            </div>
            <p className={`text-sm ${config.textColor} opacity-75`}>
              {servicesDown === 0
                ? `All ${totalServices} services are running smoothly`
                : `${servicesDown} of ${totalServices} services are currently experiencing issues`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
