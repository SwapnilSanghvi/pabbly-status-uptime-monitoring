export default function StatusHeader({ overallStatus, totalServices, servicesDown }) {
  const getStatusConfig = () => {
    if (servicesDown === 0) {
      return {
        text: 'All Systems Operational',
        subtitle: 'Everything is running smoothly',
        bgGradient: 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-900',
        subtitleColor: 'text-green-700',
        iconBg: 'bg-green-100',
        iconDotColor: 'bg-green-500',
        badgeBg: 'bg-green-500',
        badgeText: 'text-white',
        shadowColor: 'shadow-green-200/50',
      };
    } else if (servicesDown < totalServices / 2) {
      return {
        text: 'Partial System Outage',
        subtitle: 'Some services are experiencing issues',
        bgGradient: 'bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-900',
        subtitleColor: 'text-yellow-700',
        iconBg: 'bg-yellow-100',
        iconDotColor: 'bg-yellow-500',
        badgeBg: 'bg-yellow-500',
        badgeText: 'text-white',
        shadowColor: 'shadow-yellow-200/50',
      };
    } else {
      return {
        text: 'Major System Outage',
        subtitle: 'Multiple services are down',
        bgGradient: 'bg-gradient-to-br from-red-50 via-rose-50 to-pink-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-900',
        subtitleColor: 'text-red-700',
        iconBg: 'bg-red-100',
        iconDotColor: 'bg-red-500',
        badgeBg: 'bg-red-500',
        badgeText: 'text-white',
        shadowColor: 'shadow-red-200/50',
      };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`${config.bgGradient} border-t border-b ${config.borderColor} relative overflow-hidden`}>
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-24 -right-24 w-96 h-96 ${config.iconBg} rounded-full opacity-20 blur-3xl`}></div>
        <div className={`absolute -bottom-24 -left-24 w-96 h-96 ${config.iconBg} rounded-full opacity-20 blur-3xl`}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative">
        <div className="flex items-center justify-center">
          <div className="text-center">
            {/* Status Text with Icon */}
            <div className="flex items-center justify-center gap-2.5 mb-2">
              {/* Status Indicator Dot */}
              <span className={`relative flex h-3 w-3`}>
                {servicesDown === 0 && (
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.iconDotColor} opacity-75`}></span>
                )}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${config.iconDotColor}`}></span>
              </span>

              <h2 className={`text-xl sm:text-2xl font-bold ${config.textColor}`}>
                {config.text}
              </h2>
            </div>

            {/* Subtitle */}
            <p className={`text-sm ${config.subtitleColor} mb-2`}>
              {servicesDown === 0
                ? `All ${totalServices} ${totalServices === 1 ? 'service' : 'services'} are running smoothly`
                : `${servicesDown} of ${totalServices} ${totalServices === 1 ? 'service' : 'services'} experiencing issues`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
