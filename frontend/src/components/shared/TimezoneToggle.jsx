import { useState, useRef, useEffect } from 'react';
import { useTimezone } from '../../contexts/TimezoneContext';
import {
  getGroupedTimezones,
  getTimezoneLabel,
  getTimezoneAbbreviation,
  findTimezone,
} from '../../utils/timezone';

export default function TimezoneToggle() {
  const { timezone, setTimezone } = useTimezone();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const groupedTimezones = getGroupedTimezones();
  const currentTz = findTimezone(timezone);
  const currentLabel = currentTz ? currentTz.label : getTimezoneLabel(timezone);
  const currentAbbr = getTimezoneAbbreviation(timezone);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (tzValue) => {
    setTimezone(tzValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Filter timezones based on search term
  const filterTimezones = (tzList) => {
    if (!searchTerm) return tzList;
    return tzList.filter((tz) =>
      tz.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tz.abbr.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <svg
          className="w-4 h-4 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="hidden sm:inline">{currentLabel}</span>
        <span className="text-gray-500">({currentAbbr})</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-hidden">
          {/* Search Box */}
          <div className="p-3 border-b border-gray-200 sticky top-0 bg-white">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search timezones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Timezone List */}
          <div className="overflow-y-auto max-h-72">
            {Object.entries(groupedTimezones).map(([region, timezones]) => {
              const filteredTzs = filterTimezones(timezones);
              if (filteredTzs.length === 0) return null;

              return (
                <div key={region} className="border-b border-gray-100 last:border-b-0">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">
                    {region}
                  </div>
                  <div>
                    {filteredTzs.map((tz) => (
                      <button
                        key={tz.value}
                        onClick={() => handleSelect(tz.value)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 flex items-center justify-between group ${
                          timezone === tz.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {timezone === tz.value && (
                            <svg
                              className="w-4 h-4 text-blue-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                          <span>{tz.label}</span>
                        </span>
                        <span className="text-xs text-gray-500">({tz.abbr})</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* No results message */}
            {searchTerm &&
              Object.values(groupedTimezones).every(
                (tzs) => filterTimezones(tzs).length === 0
              ) && (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  No timezones found matching "{searchTerm}"
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
